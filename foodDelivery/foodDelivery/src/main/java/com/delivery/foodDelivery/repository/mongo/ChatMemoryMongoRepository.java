package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMemoryMongoRepository extends MongoRepository<ChatMemoryDocument, String> {
    List<ChatMemoryDocument> findByUserIdOrderByTimestampAsc(String userId);
}
