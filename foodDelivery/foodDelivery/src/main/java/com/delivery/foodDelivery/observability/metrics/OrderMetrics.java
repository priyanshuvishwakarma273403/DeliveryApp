package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class OrderMetrics {

    private final Counter createdTotal;
    private final Counter confirmedTotal;
    private final Counter cancelledTotal;
    private final Counter completedTotal;
    private final Counter failedTotal;
    private final MeterRegistry meterRegistry;

    public OrderMetrics(MeterRegistry registry) {
        this.meterRegistry = registry;
        this.createdTotal = Counter.builder("ecommerce_orders_created_total")
                .description("Total orders created/placed")
                .register(registry);
        this.confirmedTotal = Counter.builder("ecommerce_orders_confirmed_total")
                .description("Total orders confirmed")
                .register(registry);
        this.cancelledTotal = Counter.builder("ecommerce_orders_cancelled_total")
                .description("Total orders cancelled")
                .register(registry);
        this.completedTotal = Counter.builder("ecommerce_orders_completed_total")
                .description("Total orders completed (delivered)")
                .register(registry);
        this.failedTotal = Counter.builder("ecommerce_orders_failed_total")
                .description("Total orders failed during lifecycle/placement")
                .register(registry);
    }

    public void incrementCreated() {
        createdTotal.increment();
    }

    public void incrementConfirmed() {
        confirmedTotal.increment();
    }

    public void incrementCancelled() {
        cancelledTotal.increment();
    }

    public void incrementCompleted() {
        completedTotal.increment();
    }

    public void incrementFailed() {
        failedTotal.increment();
    }

    public void recordTransitionDuration(String fromStatus, String toStatus, Duration duration) {
        Timer.builder("ecommerce_orders_transition_duration_seconds")
                .tag("from_status", fromStatus)
                .tag("to_status", toStatus)
                .description("Duration between order lifecycle stages")
                .register(meterRegistry)
                .record(duration);
    }
}
