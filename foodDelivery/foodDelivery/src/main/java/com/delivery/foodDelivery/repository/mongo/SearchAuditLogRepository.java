package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.SearchAuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchAuditLogRepository extends MongoRepository<SearchAuditLog, String> {
    List<SearchAuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
