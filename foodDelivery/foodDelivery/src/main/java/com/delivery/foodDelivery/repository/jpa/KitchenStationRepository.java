package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenStationRepository extends JpaRepository<KitchenStation, Long> {
    List<KitchenStation> findByRestaurantId(String restaurantId);
    Optional<KitchenStation> findByRestaurantIdAndName(String restaurantId, String name);
    Optional<KitchenStation> findByStationId(String stationId);
}
