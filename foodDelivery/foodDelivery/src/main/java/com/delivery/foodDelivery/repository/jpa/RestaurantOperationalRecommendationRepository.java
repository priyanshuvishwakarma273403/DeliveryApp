package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RestaurantOperationalRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantOperationalRecommendationRepository extends JpaRepository<RestaurantOperationalRecommendation, Long> {
    List<RestaurantOperationalRecommendation> findByRestaurantId(String restaurantId);
    List<RestaurantOperationalRecommendation> findByRestaurantIdAndStatus(String restaurantId, String status);
}
