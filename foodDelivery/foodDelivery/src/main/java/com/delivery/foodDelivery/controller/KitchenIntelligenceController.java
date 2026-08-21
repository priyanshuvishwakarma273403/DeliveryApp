package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.service.KitchenIntelligenceService;
import com.delivery.foodDelivery.service.RiderKitchenSyncEngine;
import com.delivery.foodDelivery.service.KitchenWasteRiskEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/v1/kitchen")
@RequiredArgsConstructor
@Slf4j
public class KitchenIntelligenceController {

    private final KitchenIntelligenceService kitchenService;
    private final RiderKitchenSyncEngine riderSyncEngine;
    private final KitchenWasteRiskEngine wasteRiskEngine;
    
    private final com.delivery.foodDelivery.repository.jpa.KitchenStationRepository stationRepository;
    private final com.delivery.foodDelivery.repository.jpa.KitchenTaskRepository taskRepository;
    private final com.delivery.foodDelivery.repository.jpa.DishPreparationProfileRepository profileRepository;
    private final com.delivery.foodDelivery.repository.jpa.RestaurantInventoryMetricRepository inventoryMetricRepository;
    private final com.delivery.foodDelivery.repository.jpa.OrderRepository orderRepository;
    private final com.delivery.foodDelivery.service.OrderStateManager orderStateManager;

    @GetMapping("/{restaurantId}/state")
    public ResponseEntity<KitchenDigitalTwin> getKitchenState(@PathVariable String restaurantId) {
        KitchenDigitalTwin twin = kitchenService.updateAndPublishKitchenState(restaurantId);
        return ResponseEntity.ok(twin);
    }

    @GetMapping("/{restaurantId}/stations")
    public ResponseEntity<List<KitchenStation>> getStations(@PathVariable String restaurantId) {
        List<KitchenStation> stations = stationRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(stations);
    }

    @PostMapping("/{restaurantId}/stations/{stationId}/status")
    public ResponseEntity<Map<String, String>> updateStationStatus(
            @PathVariable String restaurantId,
            @PathVariable String stationId,
            @RequestParam String status) {
        kitchenService.updateStationStatus(restaurantId, stationId, status.toUpperCase());
        return ResponseEntity.ok(Map.of("message", "Station status updated successfully."));
    }

    @GetMapping("/{restaurantId}/tasks")
    public ResponseEntity<List<KitchenTask>> getTasks(@PathVariable String restaurantId) {
        // Query tasks for active orders in this restaurant
        List<KitchenTask> activeTasks = taskRepository.findAll().stream()
                .filter(t -> t.getTaskId().startsWith(restaurantId) || t.getStationId() != null)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(activeTasks);
    }

    @PostMapping("/{restaurantId}/tasks/{taskId}/complete")
    public ResponseEntity<Map<String, String>> completeTask(
            @PathVariable String restaurantId,
            @PathVariable String taskId) {
        kitchenService.completeTask(restaurantId, taskId);
        return ResponseEntity.ok(Map.of("message", "Task marked as completed."));
    }

    @GetMapping("/{restaurantId}/waste-risk")
    public ResponseEntity<KitchenWasteRiskEngine.WasteRiskEstimate> getWasteRisk(
            @PathVariable String restaurantId,
            @RequestParam String dishId,
            @RequestParam int forecastedDemand,
            @RequestParam int activePreps) {
        
        DishPreparationProfile profile = profileRepository.findByDishId(dishId).orElse(null);
        RestaurantInventoryMetric inv = inventoryMetricRepository.findByRestaurantId(restaurantId).stream()
                .findFirst().orElse(null);

        KitchenWasteRiskEngine.WasteRiskEstimate estimate = wasteRiskEngine.estimateWasteRisk(
                restaurantId, profile, inv, forecastedDemand, activePreps
        );
        return ResponseEntity.ok(estimate);
    }

    @GetMapping("/{restaurantId}/rider-sync")
    public ResponseEntity<Map<String, Object>> getRiderSync(
            @PathVariable String restaurantId,
            @RequestParam double predictedPrepTimeRemaining,
            @RequestParam double riderEta) {
        
        boolean recommendDispatch = riderSyncEngine.recommendRiderDispatch(predictedPrepTimeRemaining, riderEta);
        Map<String, Object> response = new HashMap<>();
        response.put("recommendDispatch", recommendDispatch);
        response.put("action", recommendDispatch ? "DISPATCH_NOW" : "HOLD_DISPATCH");
        response.put("recommendedDelayMinutes", recommendDispatch ? 0.0 : Math.max(0.0, predictedPrepTimeRemaining - riderEta));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{restaurantId}/capacity")
    public ResponseEntity<Map<String, String>> adjustCapacity(
            @PathVariable String restaurantId,
            @RequestParam String stationId,
            @RequestParam int capacity) {
        Optional<KitchenStation> stationOpt = stationRepository.findByStationId(stationId);
        if (stationOpt.isPresent()) {
            KitchenStation station = stationOpt.get();
            station.setCapacity(capacity);
            stationRepository.save(station);
            kitchenService.updateAndPublishKitchenState(restaurantId);
            return ResponseEntity.ok(Map.of("message", "Capacity updated successfully."));
        }
        return ResponseEntity.status(404).body(Map.of("error", "Station not found."));
    }

    @PostMapping("/{restaurantId}/stations/{stationId}/toggle")
    public ResponseEntity<Map<String, String>> toggleStationState(
            @PathVariable String restaurantId,
            @PathVariable String stationId) {
        Optional<KitchenStation> stationOpt = stationRepository.findByStationId(stationId);
        if (stationOpt.isPresent()) {
            KitchenStation station = stationOpt.get();
            String newStatus = "ACTIVE".equalsIgnoreCase(station.getStatus()) ? "OFFLINE" : "ACTIVE";
            kitchenService.updateStationStatus(restaurantId, stationId, newStatus);
            return ResponseEntity.ok(Map.of("status", newStatus, "message", "Station status toggled successfully."));
        }
        return ResponseEntity.status(404).body(Map.of("error", "Station not found."));
    }

    @PostMapping("/{restaurantId}/orders/{orderId}/ready")
    public ResponseEntity<Map<String, String>> markOrderReady(
            @PathVariable String restaurantId,
            @PathVariable Long orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                List<KitchenTask> remaining = taskRepository.findByOrderId(orderId);
                for (KitchenTask task : remaining) {
                    if (!"COMPLETED".equalsIgnoreCase(task.getStatus())) {
                        task.setStatus("COMPLETED");
                        task.setCompletedAt(LocalDateTime.now());
                        taskRepository.save(task);
                    }
                }
                
                orderStateManager.transitionTo(orderId, com.delivery.foodDelivery.enums.OrderStatus.FOOD_READY, 
                        UUID.randomUUID().toString(), "KITCHEN_INTELLIGENCE");
                riderSyncEngine.recordFoodReady(orderId, restaurantId, LocalDateTime.now());
                
                kitchenService.updateAndPublishKitchenState(restaurantId);
                return ResponseEntity.ok(Map.of("message", "Order marked as ready. Rider notified."));
            }
        } catch (Exception e) {
            log.error("Failed to transition order status", e);
        }
        return ResponseEntity.status(400).body(Map.of("error", "Order not found or transition failed"));
    }
}
