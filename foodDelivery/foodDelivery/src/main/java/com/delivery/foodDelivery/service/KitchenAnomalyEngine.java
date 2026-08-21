package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.KitchenAnomaly;
import com.delivery.foodDelivery.repository.jpa.KitchenAnomalyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenAnomalyEngine {

    private final KitchenAnomalyRepository anomalyRepository;
    private final KafkaService kafkaService;
    private final ObjectMapper objectMapper;

    /**
     * Inspects current operational stats to flag anomalies.
     */
    public void detectAnomalies(
            String restaurantId,
            String stationName,
            double currentPrepTime,
            double historicalPrepTime,
            int queueLength,
            List<Long> activeOrderIds) {

        // Anomaly condition: current prep time is more than double the historical prep time, and queue size is large
        if (currentPrepTime > historicalPrepTime * 2.0 && historicalPrepTime > 0.0) {
            String orderIdsStr = activeOrderIds.toString().replace("[", "").replace("]", "");

            KitchenAnomaly anomaly = KitchenAnomaly.builder()
                    .restaurantId(restaurantId)
                    .anomalyType("PREP_TIME_SURGE")
                    .description(String.format("Station %s prep time surged to %.1f minutes (historical average is %.1f minutes).",
                            stationName, currentPrepTime, historicalPrepTime))
                    .severity("HIGH")
                    .evidence(String.format("PrepTime=%s, Expected=%s, QueueLength=%d", currentPrepTime, historicalPrepTime, queueLength))
                    .observedAt(LocalDateTime.now())
                    .affectedStation(stationName)
                    .affectedOrders(orderIdsStr)
                    .build();

            anomalyRepository.save(anomaly);
            publishAnomalyEvent(anomaly);
        }
    }

    private void publishAnomalyEvent(KitchenAnomaly anomaly) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "KITCHEN_ANOMALY_DETECTED");
            event.put("schemaVersion", 1);
            event.put("timestamp", LocalDateTime.now().toString());
            event.put("restaurantId", anomaly.getRestaurantId());
            event.put("correlationId", UUID.randomUUID().toString());
            event.put("source", "KITCHEN_INTELLIGENCE");

            Map<String, Object> payload = new HashMap<>();
            payload.put("type", anomaly.getAnomalyType());
            payload.put("severity", anomaly.getSeverity());
            payload.put("evidence", anomaly.getEvidence());
            payload.put("observedAt", anomaly.getObservedAt().toString());
            payload.put("affectedStation", anomaly.getAffectedStation());
            payload.put("affectedOrders", anomaly.getAffectedOrders());
            event.put("payload", payload);

            String json = objectMapper.writeValueAsString(event);
            kafkaService.sendMessage("foodiq.kitchen.anomaly.detected", json);
            log.info("Published KITCHEN_ANOMALY_DETECTED event for station {}", anomaly.getAffectedStation());
        } catch (Exception e) {
            log.error("Failed to publish anomaly event", e);
        }
    }
}
