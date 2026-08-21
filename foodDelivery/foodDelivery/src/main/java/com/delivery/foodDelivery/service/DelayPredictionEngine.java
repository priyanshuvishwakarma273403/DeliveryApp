package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DeliveryRiskEvent;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.DeliveryRiskEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DelayPredictionEngine {

    private final DeliveryRiskEventRepository riskEventRepository;
    private final ObjectMapper objectMapper;

    @Data
    @Builder
    public static class DelayPredictionResult {
        private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
        private double probability;
        private int predictedDelayMinutes;
        private List<String> reasons;
    }

    @Transactional
    public DelayPredictionResult predictDelay(Order order, int predictedEtaMinutes, MapFactors factors) {
        log.info("Evaluating delay risk for order {}", order.getId());

        // Default SLA: 35 minutes
        int slaTargetMinutes = 35;
        
        // Calculate minutes elapsed since creation
        long minutesElapsed = 0;
        if (order.getCreatedDate() != null) {
            minutesElapsed = Duration.between(order.getCreatedDate(), LocalDateTime.now()).toMinutes();
        }

        int totalExpectedMinutes = (int) minutesElapsed + predictedEtaMinutes;
        int delayMinutes = totalExpectedMinutes - slaTargetMinutes;

        String riskLevel = "LOW";
        double probability = 0.10;
        List<String> reasons = new ArrayList<>();

        if (delayMinutes > 0) {
            if (delayMinutes > 10) {
                riskLevel = "CRITICAL";
                probability = 0.92;
            } else if (delayMinutes > 5) {
                riskLevel = "HIGH";
                probability = 0.82;
            } else {
                riskLevel = "MEDIUM";
                probability = 0.65;
            }

            // Identify reasons based on factors
            if (factors.isKitchenBacklog()) {
                reasons.add("KITCHEN_DELAY");
            }
            if (factors.isHighTraffic()) {
                reasons.add("TRAFFIC");
            }
            if (factors.isBadWeather()) {
                reasons.add("WEATHER");
            }
            if (factors.isRiderUnavailable()) {
                reasons.add("RIDER_DELAY");
            }
            if (reasons.isEmpty()) {
                reasons.add("UNKNOWN");
            }
        } else {
            delayMinutes = 0;
        }

        DelayPredictionResult result = DelayPredictionResult.builder()
                .riskLevel(riskLevel)
                .probability(probability)
                .predictedDelayMinutes(delayMinutes)
                .reasons(reasons)
                .build();

        // Save active risk event to database if high/critical
        if (!"LOW".equals(riskLevel)) {
            try {
                String reasonsJson = objectMapper.writeValueAsString(reasons);
                // Mark older events for same order as RESOLVED
                List<DeliveryRiskEvent> existing = riskEventRepository.findByOrderIdAndStatus(order.getId(), "ACTIVE");
                for (DeliveryRiskEvent e : existing) {
                    e.setStatus("RESOLVED");
                }
                riskEventRepository.saveAll(existing);

                DeliveryRiskEvent newEvent = DeliveryRiskEvent.builder()
                        .orderId(order.getId())
                        .riskLevel(riskLevel)
                        .probability(probability)
                        .predictedDelayMinutes(delayMinutes)
                        .reasonsJson(reasonsJson)
                        .status("ACTIVE")
                        .build();
                riskEventRepository.save(newEvent);
            } catch (Exception e) {
                log.error("Failed to persist risk event for order {}", order.getId(), e);
            }
        }

        return result;
    }

    @Data
    @Builder
    public static class MapFactors {
        private boolean kitchenBacklog;
        private boolean highTraffic;
        private boolean badWeather;
        private boolean riderUnavailable;
    }
}
