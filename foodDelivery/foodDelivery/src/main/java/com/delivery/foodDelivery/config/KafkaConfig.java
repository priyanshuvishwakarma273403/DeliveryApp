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
