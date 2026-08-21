package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenBottleneck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenBottleneckRepository extends JpaRepository<KitchenBottleneck, Long> {
    List<KitchenBottleneck> findByRestaurantIdAndStatus(String restaurantId, String status);
}
