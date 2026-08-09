package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class CartMetrics {

    private final Counter cartCreatedTotal;
    private final Counter cartItemsAddedTotal;
    private final Counter checkoutStartedTotal;

    public CartMetrics(MeterRegistry registry) {
        this.cartCreatedTotal = Counter.builder("ecommerce_cart_created_total")
                .description("Total carts created")
                .register(registry);
        this.cartItemsAddedTotal = Counter.builder("ecommerce_cart_items_added_total")
                .description("Total items added to carts")
                .register(registry);
        this.checkoutStartedTotal = Counter.builder("ecommerce_checkout_started_total")
                .description("Total checkouts started")
                .register(registry);
    }

    public void incrementCartCreated() {
        cartCreatedTotal.increment();
    }

    public void incrementItemsAdded(int quantity) {
        cartItemsAddedTotal.increment(quantity);
    }

    public void incrementCheckoutStarted() {
        checkoutStartedTotal.increment();
    }
}
