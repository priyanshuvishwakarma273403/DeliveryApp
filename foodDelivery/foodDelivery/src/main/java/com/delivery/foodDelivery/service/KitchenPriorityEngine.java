package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.DishPreparationProfile;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@Slf4j
public class KitchenPriorityEngine {

    @Data
    @Builder
    public static class PriorityWeights {
        @Builder.Default private double slaUrgencyWeight = 0.4;
        @Builder.Default private double orderAgeWeight = 0.25;
        @Builder.Default private double riderProximityWeight = 0.15;
        @Builder.Default private double freshnessWeight = 0.1;
        @Builder.Default private double stationLoadWeight = 0.1;
    }

    private PriorityWeights weights = PriorityWeights.builder().build();

    public void configureWeights(PriorityWeights newWeights) {
        if (newWeights != null) {
            this.weights = newWeights;
            log.info("KitchenPriorityEngine weights updated: {}", newWeights);
        }
    }

    /**
     * Calculates priority score for an order. Higher score = higher priority.
     * @param order the order entity
     * @param riderEtaMinutes estimated minutes for rider to arrive (null if unknown)
     * @param avgStationLoad average load of stations required by this order (0.0 to 1.0)
     * @param prepProfile preparation profile for the dishes (for freshness constraint)
     */
    public double calculatePriority(Order order, Double riderEtaMinutes, double avgStationLoad, DishPreparationProfile prepProfile) {
        LocalDateTime now = LocalDateTime.now();
        
        // 1. SLA Urgency: based on remaining time to promised delivery (assumed 40 min from order creation)
        LocalDateTime promisedTime = order.getCreatedDate().plusMinutes(40);
        double minutesRemaining = Duration.between(now, promisedTime).toMinutes();
        // Urgency score: higher if minutes remaining is lower. If overdue, score is maximum.
        double slaScore = minutesRemaining <= 0 ? 100.0 : Math.max(0.0, 100.0 - (minutesRemaining * 2.5));

        // 2. Order Age: minutes since created
        double ageMinutes = Duration.between(order.getCreatedDate(), now).toMinutes();
        double ageScore = Math.min(100.0, ageMinutes * 4.0); // caps at 25 minutes

        // 3. Rider Proximity: we want food ready just as rider arrives.
        // If rider is close (e.g. 2 mins), but food takes 15 mins, we need to prioritize this task.
        double riderScore = 0.0;
        if (riderEtaMinutes != null) {
            // High priority if rider is very close (e.g., riderEtaMinutes is small)
            riderScore = riderEtaMinutes <= 2.0 ? 100.0 : Math.max(0.0, 100.0 - (riderEtaMinutes * 5.0));
        }

        // 4. Food Freshness: if freshness window is small (e.g., crispy fries), prioritize closer to rider arrival
        double freshnessScore = 0.0;
        if (prepProfile != null && prepProfile.getFreshnessWindow() != null) {
            // Shorter freshness window = higher freshness priority (careful handling required)
            freshnessScore = Math.max(0.0, 100.0 - (prepProfile.getFreshnessWindow() * 2.0));
        }

        // 5. Station Load: if stations are overloaded, prioritize tasks to unblock bottlenecks
        double loadScore = avgStationLoad * 100.0;

        // Weighted calculation
        double finalScore = (slaScore * weights.getSlaUrgencyWeight()) +
                             (ageScore * weights.getOrderAgeWeight()) +
                             (riderScore * weights.getRiderProximityWeight()) +
                             (freshnessScore * weights.getFreshnessWeight()) +
                             (loadScore * weights.getStationLoadWeight());

        log.debug("Priority score calculated for Order {}: {} (SLA={}, Age={}, Rider={}, Freshness={}, Load={})",
                order.getId(), finalScore, slaScore, ageScore, riderScore, freshnessScore, loadScore);

        return finalScore;
    }
}
