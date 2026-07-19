package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.BlacklistItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlacklistItemRepository extends MongoRepository<BlacklistItem, String> {
    Optional<BlacklistItem> findByTypeAndValue(String type, String value);
    boolean existsByTypeAndValue(String type, String value);
}
