package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantSimulationRepository extends JpaRepository<RestaurantSimulation, Long> {
    List<RestaurantSimulation> findByRestaurantId(String restaurantId);
}
