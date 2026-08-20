package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ai_conversation_context", indexes = {
        @Index(name = "idx_ai_ctx_conv_id", columnList = "conversation_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIConversationContext extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AIConversation conversation;

    @Column(name = "intent_name", length = 100)
    private String intentName; // e.g. "FOOD_DISCOVERY"

    @Column(name = "context_data_json", columnDefinition = "TEXT")
    private String contextDataJson; // JSON representation of extracted slots/context
}
