package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Settlement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends MongoRepository<Settlement, String> {
    List<Settlement> findByRestaurantId(String restaurantId);
    List<Settlement> findByStatus(String status);
}
