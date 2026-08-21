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
    private final KafkaConsumerService kafkaConsumerService;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    /**
     * Send a message to a specific topic
     * @param topic Topic name
     * @param message Message content (usually JSON string)
     */
    @Async
    public void sendMessage(String topic, String message) {
        String eventType = "GENERIC";
        if ("order-events".equals(topic)) {
            eventType = "ORDER_PLACED";
        } else if ("order-updates".equals(topic)) {
            eventType = "ORDER_STATUS_UPDATE";
        } else if ("delivery-locations".equals(topic)) {
            eventType = "LOCATION_UPDATE";
        } else if (KafkaConfig.SALE_TOPIC.equals(topic)) {
            eventType = "SALE_EVENT";
        } else if (KafkaConfig.GREETINGS_TOPIC.equals(topic)) {
            eventType = "FESTIVAL_GREETING";
        } else if ("auth-events".equals(topic)) {
            eventType = "AUTH_EVENT";
        } else if ("daily-reminders".equals(topic)) {
            eventType = "DAILY_REMINDER";
        }

        if (!kafkaEnabled) {
            log.warn("Kafka is DISABLED. Running in local fallback mode. Routing message directly to consumer for topic: {}", topic);
            routeMessageDirectly(topic, message);
            return;
        }

        try {
            log.info("Sending message to Kafka topic {}: {}", topic, message);
            kafkaTemplate.send(topic, message);
            kafkaMetrics.incrementProduced(topic, eventType, "SUCCESS");
        } catch (Exception e) {
            log.error("Kafka ERROR: Could not send message to topic {}. Is Kafka connected? Falling back to direct consumer routing. Error: {}", 
                topic, e.getMessage());
            kafkaMetrics.incrementErrors(topic, eventType, e.getClass().getSimpleName());
            kafkaMetrics.incrementProduced(topic, eventType, "ERROR");
            
            // Auto fallback on exception
            routeMessageDirectly(topic, message);
        }
    }

    private void routeMessageDirectly(String topic, String message) {
        try {
            if ("auth-events".equals(topic)) {
                kafkaConsumerService.consumeAuthEvent(message);
            } else if ("order-events".equals(topic)) {
                kafkaConsumerService.consumeOrderEvents(message);
            } else if ("order-updates".equals(topic)) {
                kafkaConsumerService.consumeOrderUpdates(message);
            } else if ("daily-reminders".equals(topic)) {
                kafkaConsumerService.consumeDailyReminders(message);
            } else if (KafkaConfig.SALE_TOPIC.equals(topic)) {
                kafkaConsumerService.consumeSaleEvent(message);
            } else if (KafkaConfig.GREETINGS_TOPIC.equals(topic)) {
                kafkaConsumerService.consumeFestivalGreeting(message);
            } else if (KafkaConfig.USER_BEHAVIOR_TOPIC.equals(topic) ||
                       KafkaConfig.ORDER_COMPLETED_TOPIC.equals(topic) ||
                       KafkaConfig.ORDER_RATED_TOPIC.equals(topic) ||
                       KafkaConfig.CART_EVENTS_TOPIC.equals(topic) ||
                       KafkaConfig.RECOMMENDATION_EVENTS_TOPIC.equals(topic)) {
                kafkaConsumerService.consumeTasteDnaEvent(message);
            } else {
                log.warn("No direct routing mapping found for local fallback on topic: {}", topic);
            }
        } catch (Exception e) {
            log.error("Failed to route message directly in local fallback mode for topic {}: {}", topic, e.getMessage(), e);
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

    public void sendFestivalGreeting(com.delivery.foodDelivery.dto.FestivalGreetingDTO greetingEvent) {
        try {
            String json = objectMapper.writeValueAsString(greetingEvent);
            sendMessage(KafkaConfig.GREETINGS_TOPIC, json);
        } catch (Exception e) {
            log.error("Failed to serialize greeting event: {}", e.getMessage());
        }
    }
}
