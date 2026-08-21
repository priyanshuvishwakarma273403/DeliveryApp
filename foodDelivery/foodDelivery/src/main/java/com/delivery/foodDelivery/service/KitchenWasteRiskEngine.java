package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DishPreparationProfile;
import com.delivery.foodDelivery.entity.RestaurantInventoryMetric;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class KitchenWasteRiskEngine {

    @Data
    @Builder
    public static class WasteRiskEstimate {
        private String riskLevel; // LOW, MEDIUM, HIGH
        private double wasteRiskProbability; // 0.0 to 1.0
        private String recommendedAdjustment;
        private LocalDateTime timestamp;
    }

    /**
     * Estimates waste risk based on forecasted demand vs inventory vs freshness constraints.
     */
    public WasteRiskEstimate estimateWasteRisk(
            String restaurantId,
            DishPreparationProfile profile,
            RestaurantInventoryMetric inventoryMetric,
            int forecastedDemandNext60Min,
            int activePreparations) {

        double riskProb = 0.0;
        String riskLevel = "LOW";
        String recommendation = "No adjustment needed.";

        // Freshness Window: shorter freshness window means higher risk of waste if prepared too early
        double freshnessWindow = profile != null && profile.getFreshnessWindow() != null ? profile.getFreshnessWindow() : 30.0;
        
        // Overpreparation comparison
        if (activePreparations > forecastedDemandNext60Min * 1.5) {
            riskProb += 0.50;
        } else if (activePreparations > forecastedDemandNext60Min) {
            riskProb += 0.20;
        }

        // Shorter shelf life adds to risk
        if (freshnessWindow < 15.0) {
            riskProb += 0.25;
        } else if (freshnessWindow < 30.0) {
            riskProb += 0.10;
        }

        riskProb = Math.min(1.0, riskProb);

        if (riskProb > 0.70) {
            riskLevel = "HIGH";
            recommendation = "Halt pre-preparation of this item immediately. Excess stock detected relative to demand.";
        } else if (riskProb > 0.35) {
            riskLevel = "MEDIUM";
            recommendation = "Reduce pre-preparation batch size by 30%.";
        }

        return WasteRiskEstimate.builder()
                .riskLevel(riskLevel)
                .wasteRiskProbability(riskProb)
                .recommendedAdjustment(recommendation)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
