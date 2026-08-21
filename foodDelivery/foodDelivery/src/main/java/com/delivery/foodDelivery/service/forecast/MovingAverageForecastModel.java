package com.delivery.foodDelivery.service.forecast;

import com.delivery.foodDelivery.entity.RestaurantForecast;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class MovingAverageForecastModel implements DemandForecastModel {

    @Override
    public String getModelVersion() {
        return "moving-average-v1";
    }

    @Override
    public RestaurantForecast generateForecast(
            String restaurantId, 
            String horizon, 
            List<Integer> historicalDemand, 
            Map<String, Object> context) {
        
        double predicted = 10.0;
        if (historicalDemand != null && !historicalDemand.isEmpty()) {
            int count = Math.min(5, historicalDemand.size());
            double sum = 0.0;
            for (int i = historicalDemand.size() - count; i < historicalDemand.size(); i++) {
                sum += historicalDemand.get(i);
            }
            predicted = sum / count;
        }

        int predictedOrders = (int) Math.round(predicted);
        double confidence = 0.65;

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
