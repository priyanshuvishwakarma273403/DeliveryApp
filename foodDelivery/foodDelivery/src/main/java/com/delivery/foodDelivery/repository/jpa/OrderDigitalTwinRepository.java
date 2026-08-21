package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.OrderDigitalTwin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderDigitalTwinRepository extends JpaRepository<OrderDigitalTwin, Long> {
    Optional<OrderDigitalTwin> findByOrderId(Long orderId);
}
