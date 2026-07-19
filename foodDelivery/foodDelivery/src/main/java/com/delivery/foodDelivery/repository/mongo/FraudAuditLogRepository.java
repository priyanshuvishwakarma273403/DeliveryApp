package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.FraudAuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAuditLogRepository extends MongoRepository<FraudAuditLog, String> {
    List<FraudAuditLog> findByTargetEntityId(String targetEntityId);
}
