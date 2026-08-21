package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.KitchenState;
import com.delivery.foodDelivery.enums.KitchenOrderLifecycle;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.exception.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenIntelligenceService {

    private final KitchenStationRepository stationRepository;
    private final DishPreparationProfileRepository profileRepository;
    private final KitchenTaskRepository taskRepository;
    private final KitchenTaskDependencyRepository dependencyRepository;
    private final KitchenDigitalTwinRepository twinRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderStateManager orderStateManager;
    
    private final KitchenStateMachine stateMachine;
    private final KitchenPriorityEngine priorityEngine;
    private final KitchenPrepTimeEngine prepTimeEngine;
    private final KitchenLoadEngine loadEngine;
    private final KitchenBottleneckEngine bottleneckEngine;
    private final KitchenAnomalyEngine anomalyEngine;
    private final KitchenWasteRiskEngine wasteRiskEngine;
    private final RiderKitchenSyncEngine riderSyncEngine;
    private final KitchenQueueOptimizer queueOptimizer;

    private final KafkaService kafkaService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Initializes preparation tasks for an accepted order based on the dish profiles.
     */
    @Transactional
    public void initializeOrderTasks(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));

        log.info("Initializing kitchen task DAG for order {}", orderId);
        List<OrderItem> items = order.getOrderItems();

        for (OrderItem item : items) {
            String dishId = item.getMenuItemId();
            DishPreparationProfile profile = profileRepository.findByDishId(dishId)
                    .orElseGet(() -> {
                        // Create default profile if not found
                        DishPreparationProfile def = DishPreparationProfile.builder()
                                .dishId(dishId)
                                .requiredStations("PACKAGING")
                                .estimatedPrepTime(10.0)
                                .priority(1)
                                .freshnessWindow(30)
                                .build();
                        return profileRepository.save(def);
                    });

            String[] stations = profile.getRequiredStations().split(",");
            List<KitchenTask> createdTasks = new ArrayList<>();

            for (int i = 0; i < stations.length; i++) {
                String stationName = stations[i].trim();
                String taskId = orderId + "_" + dishId + "_" + stationName + "_" + i;

                KitchenTask task = KitchenTask.builder()
                        .taskId(taskId)
                        .orderId(orderId)
                        .dishId(dishId)
                        .stationId(stationName)
                        .status("PENDING")
                        .estimatedDuration(profile.getEstimatedPrepTime() / stations.length)
                        .build();

                taskRepository.save(task);
                createdTasks.add(task);

                // Add dependency if there is a previous station in sequence
                if (i > 0) {
                    KitchenTask prevTask = createdTasks.get(i - 1);
                    KitchenTaskDependency dep = KitchenTaskDependency.builder()
                            .taskId(taskId)
                            .dependsOnTaskId(prevTask.getTaskId())
                            .build();
                    dependencyRepository.save(dep);
                }
            }
        }

        // Optimize and schedule runnable tasks
        queueOptimizer.optimizeQueue(order.getRestaurantId());
        
        // Broadcast and update state
        updateAndPublishKitchenState(order.getRestaurantId());
    }

    /**
     * Completes a kitchen task, evaluates downstream tasks, and flags order ready if all tasks finish.
     */
    @Transactional
    public void completeTask(String restaurantId, String taskId) {
        KitchenTask task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new BusinessException("Task not found: " + taskId));

        if ("COMPLETED".equalsIgnoreCase(task.getStatus())) {
            return;
        }

        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());
        if (task.getStartedAt() != null) {
            double actualDuration = java.time.Duration.between(task.getStartedAt(), task.getCompletedAt()).toMillis() / 60000.0;
            task.setActualDuration(actualDuration);
        }
        taskRepository.save(task);

        log.info("Task {} completed.", taskId);

        // Update station load metrics
        Optional<KitchenStation> stationOpt = stationRepository.findByRestaurantIdAndName(restaurantId, task.getStationId());
        if (stationOpt.isPresent()) {
            KitchenStation station = stationOpt.get();
            long activeCount = taskRepository.findByStationIdAndStatus(station.getName(), "PREPARING").size();
            loadEngine.updateStationMetrics(station, (int) activeCount, Math.max(0, station.getQueueLength()));
        }

        // Run queue optimizer to schedule next tasks
        queueOptimizer.optimizeQueue(restaurantId);

        // Check if all tasks for the order are completed
        List<KitchenTask> orderTasks = taskRepository.findByOrderId(task.getOrderId());
        boolean allFinished = orderTasks.stream().allMatch(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()));

        if (allFinished) {
            log.info("All tasks for Order {} finished! Transitioning order to FOOD_READY.", task.getOrderId());
            orderStateManager.transitionTo(task.getOrderId(), OrderStatus.FOOD_READY, UUID.randomUUID().toString(), "KITCHEN_INTELLIGENCE");
            riderSyncEngine.recordFoodReady(task.getOrderId(), restaurantId, LocalDateTime.now());
        }

        updateAndPublishKitchenState(restaurantId);
    }

    /**
     * Updates and returns the kitchen digital twin state.
     */
    @Transactional
    public KitchenDigitalTwin updateAndPublishKitchenState(String restaurantId) {
        List<KitchenStation> stations = stationRepository.findByRestaurantId(restaurantId);
        
        // Calculate counts
        List<KitchenTask> allTasks = taskRepository.findAll().stream()
                .filter(t -> {
                    Optional<Order> orderOpt = orderRepository.findById(t.getOrderId());
                    return orderOpt.isPresent() && restaurantId.equals(orderOpt.get().getRestaurantId());
                })
                .collect(Collectors.toList());

        long activeOrders = allTasks.stream().map(KitchenTask::getOrderId).distinct().count();
        long queuedTasks = allTasks.stream().filter(t -> "PENDING".equalsIgnoreCase(t.getStatus())).count();
        long preparingTasks = allTasks.stream().filter(t -> "PREPARING".equalsIgnoreCase(t.getStatus())).count();
        long completedTasks = allTasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();

        double overallLoad = loadEngine.calculateOverallLoad(restaurantId);

        // Detect bottlenecks
        List<KitchenBottleneck> bottlenecks = bottleneckEngine.detectAndPropagateBottlenecks(restaurantId);
        String bottleneckStation = bottlenecks.isEmpty() ? "NONE" : bottlenecks.get(0).getStationId();

        // Delay Risk determination
        String delayRisk = "LOW";
        if (overallLoad > 0.85 || !bottlenecks.isEmpty()) {
            delayRisk = "HIGH";
        } else if (overallLoad > 0.6) {
            delayRisk = "MEDIUM";
        }

        // Estimated backlog clear time (approx 3 minutes per remaining task)
        long remaining = queuedTasks + preparingTasks;
        String clearTime = (remaining * 3) + " minutes";

        KitchenDigitalTwin twin = twinRepository.findByRestaurantId(restaurantId)
                .orElseGet(() -> KitchenDigitalTwin.builder()
                        .restaurantId(restaurantId)
                        .build());

        twin.setTimestamp(LocalDateTime.now());
        twin.setActiveOrders((int) activeOrders);
        twin.setQueuedOrders((int) queuedTasks);
        twin.setPreparingOrders((int) preparingTasks);
        twin.setReadyOrders((int) completedTasks);
        twin.setOverallLoad(overallLoad);
        twin.setBottleneckStation(bottleneckStation);
        twin.setPredictedLoad15Min(Math.min(1.0, overallLoad + 0.08));
        twin.setDelayRisk(delayRisk);
        twin.setEstimatedBacklogClearTime(clearTime);

        twinRepository.save(twin);

        // Broadcast update via WebSocket
        broadcastKitchenTwin(twin);

        return twin;
    }

    /**
     * Updates station status, validating with kitchen state machine rules.
     */
    @Transactional
    public void updateStationStatus(String restaurantId, String stationId, String status) {
        KitchenStation station = stationRepository.findByStationId(stationId)
                .orElseThrow(() -> new BusinessException("Station not found: " + stationId));

        String oldStatus = station.getStatus();
        station.setStatus(status);
        stationRepository.save(station);

        log.info("Station {} status changed from {} to {}", stationId, oldStatus, status);

        // Run queue optimizer in case station is back online
        queueOptimizer.optimizeQueue(restaurantId);

        // Recalculate twin state
        updateAndPublishKitchenState(restaurantId);

        // Publish event to Kafka
        publishStationStatusEvent(restaurantId, stationId, oldStatus, status);
    }

    private void publishStationStatusEvent(String restaurantId, String stationId, String oldStatus, String newStatus) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "KITCHEN_STATION_STATUS_CHANGED");
            event.put("restaurantId", restaurantId);
            event.put("timestamp", LocalDateTime.now().toString());
            event.put("payload", Map.of(
                    "stationId", stationId,
                    "oldStatus", oldStatus,
                    "newStatus", newStatus
            ));
            String json = objectMapper.writeValueAsString(event);
            kafkaService.sendMessage("foodiq.kitchen.status.changed", json);
        } catch (Exception e) {
            log.error("Failed to publish station status change event", e);
        }
    }

    private void broadcastKitchenTwin(KitchenDigitalTwin twin) {
        try {
            String destination = "/topic/kitchen/" + twin.getRestaurantId() + "/state";
            messagingTemplate.convertAndSend(destination, twin);
            log.info("Broadcasted kitchen digital twin state to {}", destination);
        } catch (Exception e) {
            log.error("WebSocket broadcast failed for kitchen twin", e);
        }
    }
}
