package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class InventoryMetrics {

    private final Counter reservationSuccessTotal;
    private final Counter reservationFailedTotal;
    private final Counter outOfStockTotal;

    public InventoryMetrics(MeterRegistry registry) {
        this.reservationSuccessTotal = Counter.builder("ecommerce_inventory_reservation_total")
                .description("Total successful inventory reservations")
                .register(registry);
        this.reservationFailedTotal = Counter.builder("ecommerce_inventory_reservation_failed_total")
                .description("Total failed inventory reservations")
                .register(registry);
        this.outOfStockTotal = Counter.builder("ecommerce_out_of_stock_total")
                .description("Total out of stock occurrences")
                .register(registry);
    }

    public void incrementReservationSuccess() {
        reservationSuccessTotal.increment();
    }

    public void incrementReservationFailed() {
        reservationFailedTotal.increment();
    }

    public void incrementOutOfStock() {
        outOfStockTotal.increment();
    }
}
