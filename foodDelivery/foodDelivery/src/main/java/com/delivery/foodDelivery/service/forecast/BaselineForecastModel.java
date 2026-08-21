package com.delivery.foodDelivery.service.forecast;

import com.delivery.foodDelivery.entity.RestaurantForecast;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class BaselineForecastModel implements DemandForecastModel {

    @Override
    public String getModelVersion() {
        return "baseline-v2";
    }

    @Override
    public RestaurantForecast generateForecast(
            String restaurantId, 
            String horizon, 
            List<Integer> historicalDemand, 
            Map<String, Object> context) {
        
        // Compute historical baseline
        double baseline = 0.0;
        if (historicalDemand != null && !historicalDemand.isEmpty()) {
            double sum = 0.0;
            for (int val : historicalDemand) {
                sum += val;
            }
            baseline = sum / historicalDemand.size();
        } else {
            // Default baseline if no history
            baseline = 15.0;
        }

        // Factor in recent trend adjustment (e.g. from context)
        double trendMultiplier = 1.0;
        if (context != null && context.containsKey("recentTrend")) {
            trendMultiplier = ((Number) context.get("recentTrend")).doubleValue();
        }

        // Factor in weather signals (e.g. rain increases delivery demand)
        double weatherMultiplier = 1.0;
        if (context != null && context.containsKey("weather")) {
            String weather = (String) context.get("weather");
            if ("RAINY".equalsIgnoreCase(weather)) {
                weatherMultiplier = 1.25; // 25% increase during rain
            } else if ("SNOWY".equalsIgnoreCase(weather)) {
                weatherMultiplier = 1.35;
            }
        }

        // Factor in promotions
        double promoMultiplier = 1.0;
        if (context != null && context.containsKey("activePromotion")) {
            Boolean hasPromo = (Boolean) context.get("activePromotion");
            if (Boolean.TRUE.equals(hasPromo)) {
                promoMultiplier = 1.20; // 20% increase
            }
        }

        double predictedValue = baseline * trendMultiplier * weatherMultiplier * promoMultiplier;
        int predictedOrders = (int) Math.round(predictedValue);
        if (predictedOrders < 0) {
            predictedOrders = 0;
        }

        // Calculate heuristic confidence
        double confidence = 0.70;
        if (historicalDemand != null && historicalDemand.size() >= 5) {
            confidence = 0.85;
        }
        if (context != null && context.containsKey("weatherAlert")) {
            confidence -= 0.10;
        }

        String trend = "STABLE";
        if (trendMultiplier > 1.05) {
            trend = "INCREASING";
        } else if (trendMultiplier < 0.95) {
            trend = "DECREASING";
        }

        return RestaurantForecast.builder()
                .restaurantId(restaurantId)
                .horizon(horizon)
                .predictedOrders(predictedOrders)
                .confidence(Math.max(0.10, Math.min(1.0, confidence)))
                .trend(trend)
                .modelVersion(getModelVersion())
                .generatedAt(LocalDateTime.now())
                .build();
    }
}
