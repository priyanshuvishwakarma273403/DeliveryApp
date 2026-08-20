package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RecommendationFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationFeedbackRepository extends JpaRepository<RecommendationFeedback, Long> {
    List<RecommendationFeedback> findByUserId(Long userId);
    List<RecommendationFeedback> findByUserIdAndItemIdAndItemType(Long userId, String itemId, String itemType);
}
