package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenAnomalyRepository extends JpaRepository<KitchenAnomaly, Long> {
    List<KitchenAnomaly> findByRestaurantId(String restaurantId);
}
