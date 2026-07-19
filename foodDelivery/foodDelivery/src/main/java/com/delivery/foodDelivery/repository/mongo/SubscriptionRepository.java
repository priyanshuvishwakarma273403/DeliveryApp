package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Subscription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    Optional<Subscription> findByUserId(String userId);
    List<Subscription> findByStatus(String status);
}
