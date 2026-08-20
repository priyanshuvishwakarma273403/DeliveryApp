package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_messages", indexes = {
        @Index(name = "idx_ai_msg_conv_id", columnList = "conversation_id"),
        @Index(name = "idx_ai_msg_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AIConversation conversation;

    @Column(nullable = false, length = 50)
    private String role; // "user", "assistant", "system"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "extracted_intent", length = 100)
    private String extractedIntent; // e.g. "FOOD_DISCOVERY"

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AIToolCall> toolCalls = new ArrayList<>();
}
