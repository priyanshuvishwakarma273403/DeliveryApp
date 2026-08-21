package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantKitchenMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantKitchenMetricRepository extends JpaRepository<RestaurantKitchenMetric, Long> {
    List<RestaurantKitchenMetric> findByRestaurantId(String restaurantId);
    List<RestaurantKitchenMetric> findByRestaurantIdAndStationNameOrderByTimestampDesc(String restaurantId, String stationName);
}
