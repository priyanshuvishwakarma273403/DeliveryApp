package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class KafkaMetrics {

    private final MeterRegistry meterRegistry;

    public KafkaMetrics(MeterRegistry registry) {
        this.meterRegistry = registry;
    }

    public void incrementProduced(String topic, String eventType, String status) {
        Counter.builder("ecommerce_kafka_messages_produced_total")
                .tag("topic", topic)
                .tag("event_type", eventType)
                .tag("status", status)
                .description("Total Kafka messages produced")
                .register(meterRegistry)
                .increment();
    }

    public void incrementConsumed(String topic, String eventType, String status) {
        Counter.builder("ecommerce_kafka_messages_consumed_total")
                .tag("topic", topic)
                .tag("event_type", eventType)
                .tag("status", status)
                .description("Total Kafka messages consumed")
                .register(meterRegistry)
                .increment();
    }

    public void recordProcessingTime(String topic, String eventType, Duration duration) {
        Timer.builder("ecommerce_kafka_processing_seconds")
                .tag("topic", topic)
                .tag("event_type", eventType)
                .description("Kafka message processing duration")
                .register(meterRegistry)
                .record(duration);
    }

    public void incrementErrors(String topic, String eventType, String errorType) {
        Counter.builder("ecommerce_kafka_errors_total")
                .tag("topic", topic)
                .tag("event_type", eventType)
                .tag("error_type", errorType)
                .description("Total Kafka producer/consumer errors")
                .register(meterRegistry)
                .increment();
    }
}
