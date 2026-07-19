package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.RecommendationMetric;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationMetricRepository extends MongoRepository<RecommendationMetric, String> {
    long countByStrategyAndAction(String strategy, String action);
    long countByAction(String action);
    List<RecommendationMetric> findByUserId(String userId);
}
