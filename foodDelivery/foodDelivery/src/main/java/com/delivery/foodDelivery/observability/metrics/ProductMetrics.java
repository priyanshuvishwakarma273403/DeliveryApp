package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class ProductMetrics {

    private final Counter productViewsTotal;
    private final Counter productSearchTotal;

    public ProductMetrics(MeterRegistry registry) {
        this.productViewsTotal = Counter.builder("ecommerce_product_views_total")
                .description("Total product (restaurant) views")
                .register(registry);
        this.productSearchTotal = Counter.builder("ecommerce_product_search_total")
                .description("Total product searches")
                .register(registry);
    }

    public void incrementViews() {
        productViewsTotal.increment();
    }

    public void incrementSearch() {
        productSearchTotal.increment();
    }
}
