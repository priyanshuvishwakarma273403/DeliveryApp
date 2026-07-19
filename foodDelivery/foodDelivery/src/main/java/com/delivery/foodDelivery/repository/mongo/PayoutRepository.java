package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Payout;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutRepository extends MongoRepository<Payout, String> {
    List<Payout> findByDriverId(String driverId);
    List<Payout> findByStatus(String status);
}
