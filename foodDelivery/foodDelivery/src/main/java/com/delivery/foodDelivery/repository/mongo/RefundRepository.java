package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Refund;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends MongoRepository<Refund, String> {
    Optional<Refund> findByTransactionId(String transactionId);
    Optional<Refund> findByOrderId(String orderId);
    List<Refund> findByStatus(String status);
}
