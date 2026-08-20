package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.AIConversationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIConversationContextRepository extends JpaRepository<AIConversationContext, UUID> {
    Optional<AIConversationContext> findByConversationId(UUID conversationId);
}
