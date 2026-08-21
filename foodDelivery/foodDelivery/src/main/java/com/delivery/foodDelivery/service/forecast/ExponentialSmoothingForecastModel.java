package com.delivery.foodDelivery.service.forecast;

import com.delivery.foodDelivery.entity.RestaurantForecast;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class ExponentialSmoothingForecastModel implements DemandForecastModel {

    @Override
    public String getModelVersion() {
        return "exponential-smoothing-v1";
    }

    @Override
    public RestaurantForecast generateForecast(
            String restaurantId, 
            String horizon, 
            List<Integer> historicalDemand, 
            Map<String, Object> context) {
        
        double alpha = 0.3;
        double smoothed = 10.0;

        if (historicalDemand != null && !historicalDemand.isEmpty()) {
            smoothed = historicalDemand.get(0);
            for (int i = 1; i < historicalDemand.size(); i++) {
                smoothed = alpha * historicalDemand.get(i) + (1 - alpha) * smoothed;
            }
        }

        int predictedOrders = (int) Math.round(smoothed);
        double confidence = 0.70;

        return RestaurantForecast.builder()
                .restaurantId(restaurantId)
                .horizon(horizon)
                .predictedOrders(predictedOrders)
                .confidence(confidence)
                .trend("STABLE")
                .modelVersion(getModelVersion())
                .generatedAt(LocalDateTime.now())
                .build();
    }
}
