package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RiderWaitingMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderWaitingMetricRepository extends JpaRepository<RiderWaitingMetric, Long> {
    Optional<RiderWaitingMetric> findByOrderId(Long orderId);
    List<RiderWaitingMetric> findByRestaurantId(String restaurantId);
}
