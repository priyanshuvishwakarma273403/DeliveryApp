package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantAnomalyRepository extends JpaRepository<RestaurantAnomaly, Long> {
    List<RestaurantAnomaly> findByRestaurantId(String restaurantId);
}
