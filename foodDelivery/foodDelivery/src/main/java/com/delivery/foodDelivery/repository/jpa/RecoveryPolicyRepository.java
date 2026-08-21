package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.RecoveryPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryPolicyRepository extends JpaRepository<RecoveryPolicy, Long> {
    Optional<RecoveryPolicy> findByRuleName(String ruleName);
    List<RecoveryPolicy> findByRiskType(String riskType);
}
