package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_conversations", indexes = {
        @Index(name = "idx_ai_conv_user_id", columnList = "user_id"),
        @Index(name = "idx_ai_conv_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIConversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("createdDate ASC")
    private List<AIMessage> messages = new ArrayList<>();

    @OneToOne(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private AIConversationContext context;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AIRecommendation> recommendations = new ArrayList<>();
}
