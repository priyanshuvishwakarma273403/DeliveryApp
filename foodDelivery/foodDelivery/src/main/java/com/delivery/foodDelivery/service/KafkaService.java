package com.delivery.foodDelivery.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.delivery.foodDelivery.dto.SaleEventDTO;
import com.delivery.foodDelivery.config.KafkaConfig;
import com.delivery.foodDelivery.observability.metrics.KafkaMetrics;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaMetrics kafkaMetrics;

    @Value("${spring.kafka.listener.auto-startup:false}")
    private boolean kafkaEnabled;

    /**
     * Send a message to a specific topic
     * @param topic Topic name
     * @param message Message content (usually JSON string)
     */
    @Async
    public void sendMessage(String topic, String message) {
        if (!kafkaEnabled) {
            log.warn("Kafka is DISABLED. Skipping message to topic: {}", topic);
            return;
        }
        String eventType = "GENERIC";
        if ("order-events".equals(topic)) {
            eventType = "ORDER_PLACED";
        } else if ("order-updates".equals(topic)) {
            eventType = "ORDER_STATUS_UPDATE";
        } else if ("delivery-locations".equals(topic)) {
            eventType = "LOCATION_UPDATE";
        } else if (KafkaConfig.SALE_TOPIC.equals(topic)) {
            eventType = "SALE_EVENT";
        }

        try {
            log.info("Sending message to Kafka topic {}: {}", topic, message);
            kafkaTemplate.send(topic, message);
            kafkaMetrics.incrementProduced(topic, eventType, "SUCCESS");
        } catch (Exception e) {
            log.error("Kafka ERROR: Could not send message to topic {}. Is Kafka connected? Error: {}", 
                topic, e.getMessage());
            kafkaMetrics.incrementErrors(topic, eventType, e.getClass().getSimpleName());
            kafkaMetrics.incrementProduced(topic, eventType, "ERROR");
        }
    }

    /**
     * Send order status update event
     * @param orderId ID of the order
     * @param status New status
     */
    public void sendOrderStatusUpdate(Long orderId, String status) {
        String message = String.format("{\"orderId\": %d, \"status\": \"%s\", \"timestamp\": %d}", 
                orderId, status, System.currentTimeMillis());
        sendMessage("order-updates", message);
    }

    /**
     * Send delivery agent location update
     * @param deliveryId Delivery ID
     * @param lat Latitude
     * @param lng Longitude
     */
    public void sendLocationUpdate(Long deliveryId, Double lat, Double lng) {
        String message = String.format("{\"deliveryId\": %d, \"lat\": %f, \"lng\": %f, \"timestamp\": %d}", 
                deliveryId, lat, lng, System.currentTimeMillis());
        sendMessage("delivery-locations", message);
    }

    public void sendSaleNotification(SaleEventDTO saleEvent) {
        try {
            String json = objectMapper.writeValueAsString(saleEvent);
            sendMessage(KafkaConfig.SALE_TOPIC, json);
        } catch (Exception e) {
            log.error("Failed to serialize sale event: {}", e.getMessage());
        }
    }
}
