package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantRiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRiskEventRepository extends JpaRepository<RestaurantRiskEvent, Long> {
    List<RestaurantRiskEvent> findByRestaurantId(String restaurantId);
    List<RestaurantRiskEvent> findByRestaurantIdAndStatus(String restaurantId, String status);
}
