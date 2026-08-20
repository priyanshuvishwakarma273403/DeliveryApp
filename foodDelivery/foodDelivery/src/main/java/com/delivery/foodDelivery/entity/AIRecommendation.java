package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ai_recommendations", indexes = {
        @Index(name = "idx_ai_rec_conv_id", columnList = "conversation_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIRecommendation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AIConversation conversation;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // "RESTAURANT" or "MENU_ITEM"

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(nullable = false)
    private Double score;

    @Column(length = 255)
    private String reason;
}
