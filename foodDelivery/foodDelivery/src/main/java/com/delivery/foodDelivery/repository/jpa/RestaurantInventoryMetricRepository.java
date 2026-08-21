package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantInventoryMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantInventoryMetricRepository extends JpaRepository<RestaurantInventoryMetric, Long> {
    List<RestaurantInventoryMetric> findByRestaurantId(String restaurantId);
    List<RestaurantInventoryMetric> findByRestaurantIdAndIngredientNameOrderByTimestampDesc(String restaurantId, String ingredientName);
}
