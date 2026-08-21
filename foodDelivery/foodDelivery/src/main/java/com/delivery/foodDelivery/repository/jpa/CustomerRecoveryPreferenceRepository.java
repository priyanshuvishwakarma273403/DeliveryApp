package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.CustomerRecoveryPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRecoveryPreferenceRepository extends JpaRepository<CustomerRecoveryPreference, Long> {
    Optional<CustomerRecoveryPreference> findByCustomerId(Long customerId);
}
