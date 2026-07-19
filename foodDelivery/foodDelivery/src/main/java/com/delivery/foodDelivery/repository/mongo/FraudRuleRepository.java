package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.FraudRule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudRuleRepository extends MongoRepository<FraudRule, String> {
    List<FraudRule> findByActive(boolean active);
}
