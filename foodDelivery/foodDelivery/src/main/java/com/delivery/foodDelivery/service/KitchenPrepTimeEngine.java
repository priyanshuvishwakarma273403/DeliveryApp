package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DishPreparationProfile;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class KitchenPrepTimeEngine {

    @Data
    @Builder
    public static class PrepTimePrediction {
        private double predictionMinutes;
        private String confidence; // ESTIMATED, HIGH, MEDIUM, LOW
        private String modelVersion;
        private LocalDateTime timestamp;
    }

    /**
     * Predicts preparation time for a dish in a restaurant.
     */
    public PrepTimePrediction predictPrepTime(
            String restaurantId,
            DishPreparationProfile profile,
            int stationQueueLength,
            double stationUtilization,
            Integer activeStaff,
            boolean hasInventoryRisk,
            boolean hasAnomaly) {

        double baseTime = profile != null ? profile.getEstimatedPrepTime() : 15.0;
        double predictedTime = baseTime;

        // 1. Station Queue Length adjustment: each item in queue adds time based on parallel capability
        if (stationQueueLength > 0) {
            predictedTime += stationQueueLength * 2.0; // Assume 2 minutes additional per queued item
        }

        // 2. Station Utilization: high utilization slows down preparation
        if (stationUtilization > 0.8) {
            predictedTime *= 1.25; // 25% delay
        } else if (stationUtilization > 0.5) {
            predictedTime *= 1.10; // 10% delay
        }

        // 3. Staff Capacity adjustment
        if (activeStaff != null && activeStaff < 3) {
            predictedTime += (3 - activeStaff) * 3.0; // Understaffed adds time
        }

        // 4. Inventory Risk
        if (hasInventoryRisk) {
            predictedTime += 5.0; // Ingredient finding delay
        }

        // 5. Recent Anomalies
        if (hasAnomaly) {
            predictedTime *= 1.40; // 40% delay due to active operational issues
        }

        // Determine confidence: heuristics are labelled "ESTIMATED" unless highly calibrated.
        // We calibrate based on standard conditions (e.g. normal utilization, no anomalies = HIGH ESTIMATED).
        String confidence = "ESTIMATED";
        if (stationUtilization < 0.8 && !hasAnomaly && !hasInventoryRisk) {
            confidence = "HIGH (ESTIMATED)";
        } else if (hasAnomaly || hasInventoryRisk) {
            confidence = "LOW (ESTIMATED)";
        } else {
            confidence = "MEDIUM (ESTIMATED)";
        }

        return PrepTimePrediction.builder()
                .predictionMinutes(Math.round(predictedTime * 10.0) / 10.0)
                .confidence(confidence)
                .modelVersion("HEURISTIC_PREP_V1.2")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
