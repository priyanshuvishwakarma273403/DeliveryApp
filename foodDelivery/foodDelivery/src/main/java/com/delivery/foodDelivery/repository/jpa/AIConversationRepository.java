package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, UUID> {
    List<AIConversation> findByUserIdOrderByCreatedDateDesc(Long userId);
    Optional<AIConversation> findByIdAndUserId(UUID id, Long userId);
}
