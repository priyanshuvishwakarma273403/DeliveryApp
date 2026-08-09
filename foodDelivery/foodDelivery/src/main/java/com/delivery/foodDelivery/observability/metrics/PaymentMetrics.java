package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class PaymentMetrics {

    private final Counter attemptsTotal;
    private final Counter successTotal;
    private final Counter failedTotal;
    private final MeterRegistry meterRegistry;

    public PaymentMetrics(MeterRegistry registry) {
        this.meterRegistry = registry;
        this.attemptsTotal = Counter.builder("ecommerce_payment_attempts_total")
                .description("Total payment attempts")
                .register(registry);
        this.successTotal = Counter.builder("ecommerce_payment_success_total")
                .description("Total successful payments")
                .register(registry);
        this.failedTotal = Counter.builder("ecommerce_payment_failed_total")
                .description("Total failed payments")
                .register(registry);
    }

    public void incrementAttempts() {
        attemptsTotal.increment();
    }

    public void incrementSuccess() {
        successTotal.increment();
    }

    public void incrementFailed() {
        failedTotal.increment();
    }

    public void recordPaymentLatency(String method, Duration duration) {
        Timer.builder("ecommerce_payment_latency_seconds")
                .tag("method", method)
                .description("Payment gateway processing latency")
                .register(meterRegistry)
                .record(duration);
    }
}
