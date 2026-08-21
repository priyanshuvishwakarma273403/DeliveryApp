package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.DishDemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishDemandForecastRepository extends JpaRepository<DishDemandForecast, Long> {
    List<DishDemandForecast> findByRestaurantId(String restaurantId);
    List<DishDemandForecast> findByRestaurantIdAndMenuItemIdOrderByGeneratedAtDesc(String restaurantId, String menuItemId);
}
