package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantStaffMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantStaffMetricRepository extends JpaRepository<RestaurantStaffMetric, Long> {
    List<RestaurantStaffMetric> findByRestaurantId(String restaurantId);
    List<RestaurantStaffMetric> findFirstByRestaurantIdOrderByTimestampDesc(String restaurantId);
}
