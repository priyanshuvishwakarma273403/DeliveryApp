package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class AiMetrics {

    private final MeterRegistry registry;
    private final Counter aiRequestsTotal;
    private final Counter aiRequestsFailed;
    private final Counter fallbackUsageTotal;
    private final Counter recommendationsGeneratedTotal;
    private final Timer aiRequestLatency;

    public AiMetrics(MeterRegistry registry) {
        this.registry = registry;
        this.aiRequestsTotal = Counter.builder("ai_requests_total")
                .description("Total AI concierge requests received")
                .register(registry);
        this.aiRequestsFailed = Counter.builder("ai_requests_failed")
                .description("Total failed AI concierge requests")
                .register(registry);
        this.fallbackUsageTotal = Counter.builder("fallback_usage_total")
                .description("Total times fallback recommendations or fallback LLM was used")
                .register(registry);
        this.recommendationsGeneratedTotal = Counter.builder("recommendations_generated_total")
                .description("Total count of structured food/restaurant recommendations generated")
                .register(registry);
        this.aiRequestLatency = Timer.builder("ai_request_latency")
                .description("Latency of AI concierge request processing")
                .register(registry);
    }

    public void incrementAiRequests() {
        aiRequestsTotal.increment();
    }

    public void incrementAiRequestsFailed() {
        aiRequestsFailed.increment();
    }

    public void incrementFallbackUsage() {
        fallbackUsageTotal.increment();
    }

    public void incrementRecommendationsGenerated(int count) {
        recommendationsGeneratedTotal.increment(count);
    }

    public void recordRequestLatency(long durationMs) {
        aiRequestLatency.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void incrementToolCalls(String toolName) {
        Counter.builder("tool_calls_total")
                .tag("tool", toolName)
                .description("Total calls to a specific AI tool")
                .register(registry)
                .increment();
    }

    public void incrementToolFailures(String toolName) {
        Counter.builder("tool_failures_total")
                .tag("tool", toolName)
                .description("Total failed calls to a specific AI tool")
                .register(registry)
                .increment();
    }
}
