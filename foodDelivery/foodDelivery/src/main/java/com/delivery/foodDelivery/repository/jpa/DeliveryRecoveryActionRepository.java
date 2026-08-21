package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.DeliveryRecoveryAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRecoveryActionRepository extends JpaRepository<DeliveryRecoveryAction, Long> {
    List<DeliveryRecoveryAction> findByOrderId(Long orderId);
}
