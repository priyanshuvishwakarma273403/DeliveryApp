package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.OrderRecoveryAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRecoveryAuditRepository extends JpaRepository<OrderRecoveryAudit, Long> {
    List<OrderRecoveryAudit> findByOrderId(Long orderId);
}
