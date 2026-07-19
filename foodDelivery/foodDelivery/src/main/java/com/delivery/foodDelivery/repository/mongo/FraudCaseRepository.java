package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.FraudCase;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudCaseRepository extends MongoRepository<FraudCase, String> {
    Optional<FraudCase> findByEntityId(String entityId);
    List<FraudCase> findByStatus(String status);
    List<FraudCase> findByEntityType(String entityType);
}
