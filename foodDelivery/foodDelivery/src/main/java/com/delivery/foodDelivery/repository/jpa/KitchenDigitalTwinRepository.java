package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenDigitalTwin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KitchenDigitalTwinRepository extends JpaRepository<KitchenDigitalTwin, Long> {
    Optional<KitchenDigitalTwin> findByRestaurantId(String restaurantId);
}
