package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.UserTasteProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTasteProfileRepository extends JpaRepository<UserTasteProfile, Long> {
    Optional<UserTasteProfile> findByUserId(String userId);
}
