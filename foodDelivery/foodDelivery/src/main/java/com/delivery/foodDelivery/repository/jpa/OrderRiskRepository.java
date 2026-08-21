package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.OrderRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRiskRepository extends JpaRepository<OrderRisk, Long> {
    List<OrderRisk> findByOrderId(Long orderId);
    List<OrderRisk> findByOrderIdAndStatus(Long orderId, String status);
    Optional<OrderRisk> findByRiskId(String riskId);
}
