package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DeliveryBatch;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.DeliveryBatchRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchingEngine {

    private final DeliveryBatchRepository batchRepository;
    private final OrderRepository orderRepository;
    private final RoutingService routingService;
    private final ObjectMapper objectMapper;

    @Data
    @Builder
    public static class BatchingCandidate {
        private Order primaryOrder;
        private Order secondaryOrder;
        private double routeDistanceKm;
        private int estimatedDurationMinutes;
        private double savingsPercentage;
    }

    public List<BatchingCandidate> findBatchingCandidates(List<Order> unassignedOrders) {
        log.info("Searching for batching candidates among {} unassigned orders", unassignedOrders.size());
        List<BatchingCandidate> candidates = new ArrayList<>();

        if (unassignedOrders.size() < 2) {
            return candidates;
        }

        // Restaurant coordinates (assume fixed for mock/simulated calculations)
        double restaurantLat = 12.9720;
        double restaurantLng = 77.5950;

        for (int i = 0; i < unassignedOrders.size(); i++) {
            Order o1 = unassignedOrders.get(i);
            // Assume destination lat/lng (mocking based on order ID or a simple offset)
            double o1Lat = 12.9800 + (o1.getId() % 10) * 0.002;
            double o1Lng = 77.6000 + (o1.getId() % 10) * 0.002;

            for (int j = i + 1; j < unassignedOrders.size(); j++) {
                Order o2 = unassignedOrders.get(j);
                
                // Constraints check
                // 1. Must be from the same restaurant in this version
                if (!o1.getRestaurantId().equals(o2.getRestaurantId())) {
                    continue;
                }

                double o2Lat = 12.9800 + (o2.getId() % 10) * 0.002;
                double o2Lng = 77.6000 + (o2.getId() % 10) * 0.002;

                // 2. Customer delivery distance should be close (within 3km)
                double customerDistance = routingService.calculateDistanceKm(o1Lat, o1Lng, o2Lat, o2Lng);
                if (customerDistance > 3.0) {
                    continue;
                }

                // Calculate route sequencing: Restaurant -> Cust 1 -> Cust 2
                double rToO1 = routingService.calculateDistanceKm(restaurantLat, restaurantLng, o1Lat, o1Lng);
                double o1ToO2 = routingService.calculateDistanceKm(o1Lat, o1Lng, o2Lat, o2Lng);
                double batchedDistance = rToO1 + o1ToO2;

                // Single deliveries distance sum
                double rToO2 = routingService.calculateDistanceKm(restaurantLat, restaurantLng, o2Lat, o2Lng);
                double singleSum = rToO1 + rToO2;

                // Savings ratio
                double savings = ((singleSum - batchedDistance) / singleSum) * 100.0;

                // Only batch if we save at least 15% distance
                if (savings >= 15.0) {
                    int batchedDuration = routingService.calculateDurationMinutes(restaurantLat, restaurantLng, o1Lat, o1Lng, "driving")
                            + routingService.calculateDurationMinutes(o1Lat, o1Lng, o2Lat, o2Lng, "driving") + 3; // +3 min handoff

                    candidates.add(BatchingCandidate.builder()
                            .primaryOrder(o1)
                            .secondaryOrder(o2)
                            .routeDistanceKm(batchedDistance)
                            .estimatedDurationMinutes(batchedDuration)
                            .savingsPercentage(savings)
                            .build());
                }
            }
        }

        log.info("Found {} batching candidates", candidates.size());
        return candidates;
    }

    @Transactional
    public DeliveryBatch createBatch(Order o1, Order o2, Long riderId) {
        log.info("Creating delivery batch for orders [{}, {}] assigned to rider {}", o1.getId(), o2.getId(), riderId);
        try {
            List<Long> orderIds = List.of(o1.getId(), o2.getId());
            String ordersJson = objectMapper.writeValueAsString(orderIds);

            DeliveryBatch batch = DeliveryBatch.builder()
                    .riderId(riderId)
                    .ordersJson(ordersJson)
                    .status("ACTIVE")
                    .estimatedCompletionTime(LocalDateTime.now().plusMinutes(25))
                    .risk("SAFE")
                    .build();

            return batchRepository.save(batch);
        } catch (Exception e) {
            log.error("Failed to serialize or save delivery batch", e);
            throw new RuntimeException("Failed to create batch", e);
        }
    }
}
