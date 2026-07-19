package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.UserTasteProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTasteProfileRepository extends MongoRepository<UserTasteProfile, String> {
    Optional<UserTasteProfile> findByUserId(String userId);
}
