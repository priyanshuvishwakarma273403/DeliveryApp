package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.DeliveryPolicyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryPolicyConfigRepository extends JpaRepository<DeliveryPolicyConfig, Long> {
    Optional<DeliveryPolicyConfig> findByPolicyKey(String policyKey);
}
