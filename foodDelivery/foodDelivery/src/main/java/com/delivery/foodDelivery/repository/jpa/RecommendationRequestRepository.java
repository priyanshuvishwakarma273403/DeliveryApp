package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RecommendationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRequestRepository extends JpaRepository<RecommendationRequest, String> {
    List<RecommendationRequest> findByUserIdOrderByTimestampDesc(Long userId);
}
