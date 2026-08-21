package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantDigitalTwinState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantDigitalTwinStateRepository extends JpaRepository<RestaurantDigitalTwinState, Long> {
    Optional<RestaurantDigitalTwinState> findByRestaurantId(String restaurantId);
}
