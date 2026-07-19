package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.NotificationCampaign;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationCampaignRepository extends MongoRepository<NotificationCampaign, String> {
    List<NotificationCampaign> findByStatus(String status);
}
