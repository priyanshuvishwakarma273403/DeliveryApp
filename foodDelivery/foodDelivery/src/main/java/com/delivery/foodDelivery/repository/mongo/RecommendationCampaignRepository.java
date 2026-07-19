package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.RecommendationCampaign;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationCampaignRepository extends MongoRepository<RecommendationCampaign, String> {
    List<RecommendationCampaign> findByActive(boolean active);
}
