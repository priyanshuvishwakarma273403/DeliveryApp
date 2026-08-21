package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.KitchenBottleneck;
import com.delivery.foodDelivery.entity.KitchenStation;
import com.delivery.foodDelivery.repository.jpa.KitchenBottleneckRepository;
import com.delivery.foodDelivery.repository.jpa.KitchenStationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenBottleneckEngine {

    private final KitchenStationRepository stationRepository;
    private final KitchenBottleneckRepository bottleneckRepository;
    private final KafkaService kafkaService;
    private final ObjectMapper objectMapper;

    /**
     * Checks stations for a restaurant and registers/resolves bottlenecks.
     */
    public List<KitchenBottleneck> detectAndPropagateBottlenecks(String restaurantId) {
        List<KitchenStation> stations = stationRepository.findByRestaurantId(restaurantId);
        List<KitchenBottleneck> detected = new ArrayList<>();

        for (KitchenStation station : stations) {
            // A station is a bottleneck if utilization > 0.9 or queue length exceeds capacity * 1.5
            double load = station.getCurrentLoad() != null ? station.getCurrentLoad() : 0.0;
            int queue = station.getQueueLength() != null ? station.getQueueLength() : 0;
            int capacity = station.getCapacity();

            boolean isOverloaded = load >= 0.9 || (queue > capacity * 1.5) || "OFFLINE".equalsIgnoreCase(station.getStatus());

            if (isOverloaded) {
                // Check if active bottleneck already exists
                List<KitchenBottleneck> existing = bottleneckRepository.findByRestaurantIdAndStatus(restaurantId, "ACTIVE");
                boolean alreadyTracked = existing.stream().anyMatch(b -> station.getName().equalsIgnoreCase(b.getStationId()));

                if (!alreadyTracked) {
                    int impact = "OFFLINE".equalsIgnoreCase(station.getStatus()) ? 15 : (queue > capacity * 2 ? 10 : 5);

                    KitchenBottleneck bottleneck = KitchenBottleneck.builder()
                            .restaurantId(restaurantId)
                            .stationId(station.getName())
                            .severity("HIGH")
                            .reason("OFFLINE".equalsIgnoreCase(station.getStatus()) ? 
                                    "Station is offline/maintenance." : 
                                    String.format("Station utilization is %.0f%% and queue length is %d.", load * 100, queue))
                            .estimatedImpactMinutes(impact)
                            .status("ACTIVE")
                            .detectedAt(LocalDateTime.now())
                            .build();

                    bottleneckRepository.save(bottleneck);
                    detected.add(bottleneck);

                    // Publish KITCHEN_BOTTLENECK_DETECTED to Kafka
                    publishBottleneckEvent(bottleneck);
                }
            } else {
                // Resolve existing bottleneck if any
                List<KitchenBottleneck> active = bottleneckRepository.findByRestaurantIdAndStatus(restaurantId, "ACTIVE");
                active.stream()
                        .filter(b -> station.getName().equalsIgnoreCase(b.getStationId()))
                        .forEach(b -> {
                            b.setStatus("RESOLVED");
                            bottleneckRepository.save(b);
                        });
            }
        }

        return detected;
    }

    private void publishBottleneckEvent(KitchenBottleneck bottleneck) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventId", UUID.randomUUID().toString());
            event.put("eventType", "KITCHEN_BOTTLENECK_DETECTED");
            event.put("schemaVersion", 1);
            event.put("timestamp", LocalDateTime.now().toString());
            event.put("restaurantId", bottleneck.getRestaurantId());
            event.put("stationId", bottleneck.getStationId());
            event.put("correlationId", UUID.randomUUID().toString());
            event.put("source", "KITCHEN_INTELLIGENCE");
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("risk", bottleneck.getSeverity());
            payload.put("estimatedImpactMinutes", bottleneck.getEstimatedImpactMinutes());
            payload.put("reason", bottleneck.getReason());
            event.put("payload", payload);

            String json = objectMapper.writeValueAsString(event);
            kafkaService.sendMessage("foodiq.kitchen.bottleneck.detected", json);
            log.info("Published KITCHEN_BOTTLENECK_DETECTED event for station {}", bottleneck.getStationId());
        } catch (Exception e) {
            log.error("Failed to publish bottleneck event", e);
        }
    }
}
