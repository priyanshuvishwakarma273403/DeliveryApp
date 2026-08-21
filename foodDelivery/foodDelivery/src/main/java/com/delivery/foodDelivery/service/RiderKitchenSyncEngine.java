package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.RiderWaitingMetric;
import com.delivery.foodDelivery.repository.jpa.RiderWaitingMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiderKitchenSyncEngine {

    private final RiderWaitingMetricRepository metricRepository;

    /**
     * Records a specific event in the rider-kitchen timeline.
     */
    public void recordRiderArrival(Long orderId, String restaurantId, LocalDateTime arrivalTime) {
        RiderWaitingMetric metric = metricRepository.findByOrderId(orderId)
                .orElseGet(() -> RiderWaitingMetric.builder()
                        .orderId(orderId)
                        .restaurantId(restaurantId)
                        .build());
        metric.setRiderArrivalAtRestaurant(arrivalTime);
        recalculateWaitingTime(metric);
        metricRepository.save(metric);
    }

    public void recordFoodReady(Long orderId, String restaurantId, LocalDateTime readyTime) {
        RiderWaitingMetric metric = metricRepository.findByOrderId(orderId)
                .orElseGet(() -> RiderWaitingMetric.builder()
                        .orderId(orderId)
                        .restaurantId(restaurantId)
                        .build());
        metric.setFoodReadyAt(readyTime);
        recalculateWaitingTime(metric);
        metricRepository.save(metric);
    }

    public void recordPickup(Long orderId, String restaurantId, LocalDateTime pickupTime) {
        RiderWaitingMetric metric = metricRepository.findByOrderId(orderId)
                .orElseGet(() -> RiderWaitingMetric.builder()
                        .orderId(orderId)
                        .restaurantId(restaurantId)
                        .build());
        metric.setPickupAt(pickupTime);
        recalculateWaitingTime(metric);
        metricRepository.save(metric);
    }

    private void recalculateWaitingTime(RiderWaitingMetric metric) {
        if (metric.getRiderArrivalAtRestaurant() != null && metric.getFoodReadyAt() != null) {
            // Rider waiting time is only positive if rider arrives before food is ready
            if (metric.getRiderArrivalAtRestaurant().isBefore(metric.getFoodReadyAt())) {
                double diff = Duration.between(metric.getRiderArrivalAtRestaurant(), metric.getFoodReadyAt()).toMillis() / 60000.0;
                metric.setRiderWaitingTimeMinutes(Math.max(0.0, diff));
            } else {
                metric.setRiderWaitingTimeMinutes(0.0);
            }
        }
    }

    /**
     * Decides if a rider should be dispatched JIT.
     * Recommends delaying dispatch if food is not ready and rider ETA is too small.
     */
    public boolean recommendRiderDispatch(double predictedPrepTimeRemainingMinutes, double riderEtaMinutes) {
        // Recommend dispatch if rider will arrive exactly or slightly after food is ready
        // (within 3 minutes buffer)
        return riderEtaMinutes >= (predictedPrepTimeRemainingMinutes - 3.0);
    }
}
