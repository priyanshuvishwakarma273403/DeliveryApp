package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.OrderRecoveryAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRecoveryActionRepository extends JpaRepository<OrderRecoveryAction, Long> {
    List<OrderRecoveryAction> findByOrderId(Long orderId);
    Optional<OrderRecoveryAction> findByActionId(String actionId);
}
