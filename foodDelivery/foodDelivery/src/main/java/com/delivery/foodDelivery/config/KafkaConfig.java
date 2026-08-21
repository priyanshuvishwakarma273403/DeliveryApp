package com.delivery.foodDelivery.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {

    public static final String SALE_TOPIC = "sale-started";
    public static final String SALE_DLT_TOPIC = "sale-started.DLT";
    public static final String AUTH_TOPIC = "auth-events";
    public static final String ORDER_EVENTS_TOPIC = "order-events";
    public static final String ORDER_UPDATES_TOPIC = "order-updates";
    public static final String DAILY_REMINDERS_TOPIC = "daily-reminders";
    public static final String GREETINGS_TOPIC = "festival-greetings";

    public static final String USER_BEHAVIOR_TOPIC = "foodiq.user.behavior";
    public static final String ORDER_COMPLETED_TOPIC = "foodiq.order.completed";
    public static final String ORDER_RATED_TOPIC = "foodiq.order.rated";
    public static final String CART_EVENTS_TOPIC = "foodiq.cart.events";
    public static final String RECOMMENDATION_EVENTS_TOPIC = "foodiq.recommendation.events";

    // AI Restaurant Digital Twin topics
    public static final String KITCHEN_STARTED_TOPIC = "foodiq.kitchen.started";
    public static final String KITCHEN_COMPLETED_TOPIC = "foodiq.kitchen.completed";
    public static final String INVENTORY_UPDATED_TOPIC = "foodiq.inventory.updated";
    public static final String INVENTORY_LOW_TOPIC = "foodiq.inventory.low";
    public static final String RESTAURANT_STATUS_TOPIC = "foodiq.restaurant.status";
    public static final String RESTAURANT_PROMOTION_TOPIC = "foodiq.restaurant.promotion";
    public static final String DELIVERY_UPDATED_TOPIC = "foodiq.delivery.updated";
    public static final String WEATHER_UPDATED_TOPIC = "foodiq.weather.updated";
    public static final String FORECAST_GENERATED_TOPIC = "foodiq.forecast.generated";
    public static final String DIGITAL_TWIN_UPDATED_TOPIC = "foodiq.digital-twin.updated";

    // New Kitchen Intelligence Topics
    public static final String KITCHEN_ORDER_RECEIVED_TOPIC = "foodiq.kitchen.order.received";
    public static final String KITCHEN_ORDER_ACCEPTED_TOPIC = "foodiq.kitchen.order.accepted";
    public static final String KITCHEN_TASK_STARTED_TOPIC = "foodiq.kitchen.task.started";
    public static final String KITCHEN_TASK_COMPLETED_TOPIC = "foodiq.kitchen.task.completed";
    public static final String KITCHEN_ORDER_READY_TOPIC = "foodiq.kitchen.order.ready";
    public static final String KITCHEN_STATION_UPDATED_TOPIC = "foodiq.kitchen.station.updated";
    public static final String KITCHEN_LOAD_UPDATED_TOPIC = "foodiq.kitchen.load.updated";
    public static final String KITCHEN_BOTTLENECK_DETECTED_TOPIC = "foodiq.kitchen.bottleneck.detected";
    public static final String KITCHEN_DELAY_PREDICTED_TOPIC = "foodiq.kitchen.delay.predicted";
    public static final String KITCHEN_INVENTORY_RISK_TOPIC = "foodiq.kitchen.inventory.risk";
    public static final String KITCHEN_ANOMALY_DETECTED_TOPIC = "foodiq.kitchen.anomaly.detected";
    public static final String KITCHEN_STATUS_CHANGED_TOPIC = "foodiq.kitchen.status.changed";


    @Bean
    public NewTopic saleTopic() {
        return TopicBuilder.name(SALE_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic saleDltTopic() {
        return TopicBuilder.name(SALE_DLT_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic authTopic() {
        return TopicBuilder.name(AUTH_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderEventsTopic() {
        return TopicBuilder.name(ORDER_EVENTS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderUpdatesTopic() {
        return TopicBuilder.name(ORDER_UPDATES_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic dailyRemindersTopic() {
        return TopicBuilder.name(DAILY_REMINDERS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic greetingsTopic() {
        return TopicBuilder.name(GREETINGS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic userBehaviorTopic() {
        return TopicBuilder.name(USER_BEHAVIOR_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderCompletedTopic() {
        return TopicBuilder.name(ORDER_COMPLETED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderRatedTopic() {
        return TopicBuilder.name(ORDER_RATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic cartEventsTopic() {
        return TopicBuilder.name(CART_EVENTS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic recommendationEventsTopic() {
        return TopicBuilder.name(RECOMMENDATION_EVENTS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic kitchenStartedTopic() {
        return TopicBuilder.name(KITCHEN_STARTED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic kitchenCompletedTopic() {
        return TopicBuilder.name(KITCHEN_COMPLETED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic inventoryUpdatedTopic() {
        return TopicBuilder.name(INVENTORY_UPDATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic inventoryLowTopic() {
        return TopicBuilder.name(INVENTORY_LOW_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic restaurantStatusTopic() {
        return TopicBuilder.name(RESTAURANT_STATUS_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic restaurantPromotionTopic() {
        return TopicBuilder.name(RESTAURANT_PROMOTION_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic deliveryUpdatedTopic() {
        return TopicBuilder.name(DELIVERY_UPDATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic weatherUpdatedTopic() {
        return TopicBuilder.name(WEATHER_UPDATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic forecastGeneratedTopic() {
        return TopicBuilder.name(FORECAST_GENERATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic digitalTwinUpdatedTopic() {
        return TopicBuilder.name(DIGITAL_TWIN_UPDATED_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean public NewTopic kitchenOrderReceivedTopic() { return TopicBuilder.name(KITCHEN_ORDER_RECEIVED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenOrderAcceptedTopic() { return TopicBuilder.name(KITCHEN_ORDER_ACCEPTED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenTaskStartedTopic() { return TopicBuilder.name(KITCHEN_TASK_STARTED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenTaskCompletedTopic() { return TopicBuilder.name(KITCHEN_TASK_COMPLETED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenOrderReadyTopic() { return TopicBuilder.name(KITCHEN_ORDER_READY_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenStationUpdatedTopic() { return TopicBuilder.name(KITCHEN_STATION_UPDATED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenLoadUpdatedTopic() { return TopicBuilder.name(KITCHEN_LOAD_UPDATED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenBottleneckDetectedTopic() { return TopicBuilder.name(KITCHEN_BOTTLENECK_DETECTED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenDelayPredictedTopic() { return TopicBuilder.name(KITCHEN_DELAY_PREDICTED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenInventoryRiskTopic() { return TopicBuilder.name(KITCHEN_INVENTORY_RISK_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenAnomalyDetectedTopic() { return TopicBuilder.name(KITCHEN_ANOMALY_DETECTED_TOPIC).partitions(3).replicas(1).build(); }
    @Bean public NewTopic kitchenStatusChangedTopic() { return TopicBuilder.name(KITCHEN_STATUS_CHANGED_TOPIC).partitions(3).replicas(1).build(); }



    /**
     * Error Handler with Retry Mechanism and Dead Letter Queue (DLQ)
     */
    @Bean
    public DefaultErrorHandler errorHandler(KafkaOperations<Object, Object> template) {
        // Retry 3 times with a delay of 5 seconds between each retry
        return new DefaultErrorHandler(
                new DeadLetterPublishingRecoverer(template),
                new FixedBackOff(5000L, 3L)
        );
    }
}
