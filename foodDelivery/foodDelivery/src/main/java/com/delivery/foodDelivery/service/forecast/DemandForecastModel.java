package com.delivery.foodDelivery.service.forecast;

import com.delivery.foodDelivery.entity.RestaurantForecast;
import java.util.List;
import java.util.Map;

public interface DemandForecastModel {
    String getModelVersion();
    RestaurantForecast generateForecast(
            String restaurantId, 
            String horizon, 
            List<Integer> historicalDemand, 
            Map<String, Object> context
    );
}
