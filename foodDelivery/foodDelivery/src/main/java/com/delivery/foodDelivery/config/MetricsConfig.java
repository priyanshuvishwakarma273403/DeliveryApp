package com.delivery.foodDelivery.config;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.config.MeterFilter;
import io.micrometer.core.instrument.distribution.DistributionStatisticConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public MeterFilter commonMetricsFilter() {
        return new MeterFilter() {
            @Override
            public Meter.Id map(Meter.Id id) {
                // Dynamically add the 'application' tag to all metrics as they are registered
                return id.withTag(Tag.of("application", "food-delivery-monolith"));
            }

            @Override
            public DistributionStatisticConfig configure(Meter.Id id, DistributionStatisticConfig config) {
                // Enable percentile histograms for HTTP request latency metrics
                if (id.getName().startsWith("http.server.requests")) {
                    return DistributionStatisticConfig.builder()
                            .percentilesHistogram(true)
                            .build()
                            .merge(config);
                }
                return config;
            }
        };
    }
}
