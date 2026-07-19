package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    Optional<Transaction> findByOrderId(String orderId);
    List<Transaction> findByCustomerId(String customerId);
    List<Transaction> findByStatus(String status);
}
