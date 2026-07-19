package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.SearchHistoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchHistoryRepository extends MongoRepository<SearchHistoryItem, String> {
    List<SearchHistoryItem> findByUserIdOrderByTimestampDesc(String userId);
    Optional<SearchHistoryItem> findByUserIdAndQueryIgnoreCase(String userId, String query);
    void deleteByUserIdAndQueryIgnoreCase(String userId, String query);
    void deleteByUserId(String userId);
}
