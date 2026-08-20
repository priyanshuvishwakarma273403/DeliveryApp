package com.delivery.foodDelivery.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "foodiq.taste-dna")
@Getter
@Setter
public class TasteDnaConfig {

    private Map<String, Double> weights = new HashMap<>();
    private double halfLifeDays = 30.0; // Recency decay half-life in days
    private double learningRate = 0.2;  // Learning rate for new updates
    private double explorationRatio = 0.2; // Default serendipity exploration ratio (20%)

    public TasteDnaConfig() {
        // Default weights (as described in Section 6)
        weights.put("ORDER_COMPLETED", 1.0);
        weights.put("USER_COMPLETED_ORDER", 1.0);
        weights.put("USER_PURCHASED", 1.0);
        weights.put("USER_REORDERED", 1.5);
        weights.put("REORDER", 1.5);
        weights.put("USER_RATED", 1.2);
        weights.put("POSITIVE_RATING", 1.2);
        weights.put("USER_LIKED", 1.0);
        weights.put("FAVORITE", 1.0);
        weights.put("USER_FAVORITED_RESTAURANT", 1.0);
        weights.put("USER_FAVORITED_DISH", 1.0);
        weights.put("USER_VIEWED_RESTAURANT", 0.15);
        weights.put("USER_VIEWED_DISH", 0.15);
        weights.put("VIEW", 0.15);
        weights.put("USER_SEARCHED", 0.10);
        weights.put("SEARCH", 0.10);
        weights.put("USER_ADDED_TO_CART", 0.60);
        weights.put("ADD_TO_CART", 0.60);
        weights.put("USER_REMOVED_FROM_CART", -0.25);
        weights.put("REMOVE_FROM_CART", -0.25);
        weights.put("NEGATIVE_RATING", -1.5);
        weights.put("USER_DISLIKED", -2.0);
        weights.put("DISLIKE", -2.0);
        weights.put("USER_ABANDONED_CART", -0.20);
        weights.put("ABANDONED_CART", -0.20);
    }

    public double getWeight(String eventType) {
        return weights.getOrDefault(eventType, 0.1);
    }
}
