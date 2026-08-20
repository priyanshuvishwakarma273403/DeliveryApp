package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.AIRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, UUID> {
    List<AIRecommendation> findByConversationId(UUID conversationId);
}
