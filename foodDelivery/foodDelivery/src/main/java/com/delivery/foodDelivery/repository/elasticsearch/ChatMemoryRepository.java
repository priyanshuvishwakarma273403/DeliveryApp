package com.delivery.foodDelivery.repository.elasticsearch;

import com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMemoryRepository extends ElasticsearchRepository<ChatMemoryDocument, String> {
    List<ChatMemoryDocument> findByUserIdOrderByTimestampAsc(String userId);
}
