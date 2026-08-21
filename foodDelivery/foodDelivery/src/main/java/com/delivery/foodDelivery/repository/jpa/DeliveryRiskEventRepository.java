package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.DeliveryRiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRiskEventRepository extends JpaRepository<DeliveryRiskEvent, Long> {
    List<DeliveryRiskEvent> findByOrderId(Long orderId);
    List<DeliveryRiskEvent> findByOrderIdAndStatus(Long orderId, String status);
}
