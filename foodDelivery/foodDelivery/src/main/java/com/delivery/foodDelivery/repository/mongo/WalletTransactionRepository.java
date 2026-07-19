package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.WalletTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends MongoRepository<WalletTransaction, String> {
    List<WalletTransaction> findByUserId(String userId);
    List<WalletTransaction> findByUserIdAndUserRole(String userId, String userRole);
}
