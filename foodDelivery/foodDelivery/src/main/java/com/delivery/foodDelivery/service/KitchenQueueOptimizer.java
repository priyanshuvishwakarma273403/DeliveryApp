package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenQueueOptimizer {

    private final KitchenTaskRepository taskRepository;
    private final KitchenTaskDependencyRepository dependencyRepository;
    private final KitchenStationRepository stationRepository;
    private final KitchenPriorityEngine priorityEngine;
    private final OrderRepository orderRepository;
    private final DishPreparationProfileRepository profileRepository;

    /**
     * Re-prioritizes and schedules pending kitchen tasks for a restaurant.
     */
    public void optimizeQueue(String restaurantId) {
        // Fetch all stations for the restaurant
        List<KitchenStation> stations = stationRepository.findByRestaurantId(restaurantId);
        Map<String, KitchenStation> stationMap = stations.stream()
                .collect(Collectors.toMap(KitchenStation::getName, s -> s, (s1, s2) -> s1));

        // Fetch all tasks for active orders in the restaurant
        List<KitchenTask> allTasks = taskRepository.findAll().stream()
                .filter(t -> {
                    Optional<Order> orderOpt = orderRepository.findById(t.getOrderId());
                    return orderOpt.isPresent() && restaurantId.equals(orderOpt.get().getRestaurantId());
                })
                .collect(Collectors.toList());

        // Get PENDING tasks
        List<KitchenTask> pendingTasks = allTasks.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());

        if (pendingTasks.isEmpty()) {
            return;
        }

        // Filter out tasks whose dependencies are not yet COMPLETED
        List<KitchenTask> runnableTasks = pendingTasks.stream()
                .filter(task -> {
                    List<KitchenTaskDependency> deps = dependencyRepository.findByTaskId(task.getTaskId());
                    for (KitchenTaskDependency dep : deps) {
                        Optional<KitchenTask> parent = taskRepository.findByTaskId(dep.getDependsOnTaskId());
                        if (parent.isEmpty() || !"COMPLETED".equalsIgnoreCase(parent.get().getStatus())) {
                            return false; // dependency not completed
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        if (runnableTasks.isEmpty()) {
            return;
        }

        // Score runnable tasks using priority engine
        Map<KitchenTask, Double> taskScores = new HashMap<>();
        for (KitchenTask task : runnableTasks) {
            Order order = orderRepository.findById(task.getOrderId()).orElse(null);
            if (order == null) continue;

            DishPreparationProfile profile = profileRepository.findByDishId(task.getDishId()).orElse(null);
            
            // Get average load for this task's station
            KitchenStation station = stationMap.get(task.getStationId());
            double load = station != null && station.getCurrentLoad() != null ? station.getCurrentLoad() : 0.0;

            double score = priorityEngine.calculatePriority(order, null, load, profile);
            taskScores.put(task, score);
        }

        // Sort runnable tasks by priority score descending
        List<KitchenTask> sortedTasks = runnableTasks.stream()
                .filter(taskScores::containsKey)
                .sorted((t1, t2) -> Double.compare(taskScores.get(t2), taskScores.get(t1)))
                .collect(Collectors.toList());

        // Assign tasks to stations if capacity allows
        for (KitchenTask task : sortedTasks) {
            KitchenStation station = stationMap.get(task.getStationId());
            if (station == null || !"ACTIVE".equalsIgnoreCase(station.getStatus())) {
                continue;
            }

            // Calculate current active tasks count on this station
            long activeCount = allTasks.stream()
                    .filter(t -> task.getStationId().equals(t.getStationId()) && "PREPARING".equalsIgnoreCase(t.getStatus()))
                    .count();

            if (activeCount < station.getCapacity()) {
                // Station has capacity! Transition task to PREPARING
                task.setStatus("PREPARING");
                task.setStartedAt(java.time.LocalDateTime.now());
                taskRepository.save(task);
                log.info("Optimized queue: Task {} transitioned to PREPARING on station {}", task.getTaskId(), task.getStationId());

                // Update station metrics
                activeCount++;
                station.setCurrentLoad((double) activeCount / station.getCapacity());
                station.setQueueLength(Math.max(0, station.getQueueLength() - 1));
                stationRepository.save(station);
            }
        }
    }
}
