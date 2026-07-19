package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.CashbackCampaign;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashbackCampaignRepository extends MongoRepository<CashbackCampaign, String> {
    List<CashbackCampaign> findByActive(boolean active);
}
