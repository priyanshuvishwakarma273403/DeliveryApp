package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.MenuItem;
import com.delivery.foodDelivery.entity.RestaurantInventoryMetric;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.jpa.RestaurantInventoryMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuAvailabilityEngine {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantInventoryMetricRepository inventoryMetricRepository;

    public enum AvailabilityState {
        AVAILABLE,
        LOW_STOCK,
        TEMPORARILY_UNAVAILABLE,
        KITCHEN_OVERLOADED,
        RESTAURANT_CLOSED
    }

    /**
     * Determines menu availability state based on inventory metrics and kitchen load.
     */
    public AvailabilityState evaluateMenuItemAvailability(
            String restaurantId,
            MenuItem menuItem,
            double kitchenLoad,
            boolean isRestaurantOpen) {

        if (!isRestaurantOpen) {
            return AvailabilityState.RESTAURANT_CLOSED;
        }

        // Fetch inventory metrics for this dish's ingredients
        List<RestaurantInventoryMetric> inventory = inventoryMetricRepository.findByRestaurantId(restaurantId);
        
        // Simple recipe heuristic: check if any required ingredient is out of stock
        // We'll map ingredients based on recipe heuristics (similar to recipe mapping in DigitalTwinService)
        String dishName = menuItem.getName().toLowerCase();
        boolean lowStock = false;
        boolean outOfStock = false;

        for (RestaurantInventoryMetric item : inventory) {
            String ingredient = item.getIngredientName().toLowerCase();
            if (dishName.contains(ingredient)) {
                if (item.getAvailableQuantity() <= 0.0) {
                    outOfStock = true;
                } else if (item.getAvailableQuantity() <= item.getReorderThreshold()) {
                    lowStock = true;
                }
            }
        }

        if (outOfStock) {
            return AvailabilityState.TEMPORARILY_UNAVAILABLE;
        }

        // If kitchen is extremely overloaded (e.g. load > 0.95), recommend throttling high-prep items
        if (kitchenLoad >= 0.95 && !"beverage".equalsIgnoreCase(menuItem.getCategory())) {
            return AvailabilityState.KITCHEN_OVERLOADED;
        }

        if (lowStock) {
            return AvailabilityState.LOW_STOCK;
        }

        return AvailabilityState.AVAILABLE;
    }

    /**
     * Generates a throttling recommendation if the kitchen is approaching unsafe overload.
     */
    public Optional<String> getThrottlingRecommendation(String restaurantId, double kitchenLoad) {
        if (kitchenLoad > 0.92) {
            return Optional.of("Reduce promotion of high-preparation items (e.g. Pizzas/Biryanis) to alleviate station workload.");
        }
        return Optional.empty();
    }
}
