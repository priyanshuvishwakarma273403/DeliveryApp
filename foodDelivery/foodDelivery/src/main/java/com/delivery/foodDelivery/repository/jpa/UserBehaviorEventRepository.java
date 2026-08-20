package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.UserBehaviorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBehaviorEventRepository extends JpaRepository<UserBehaviorEvent, Long> {
    Optional<UserBehaviorEvent> findByEventId(String eventId);
}
