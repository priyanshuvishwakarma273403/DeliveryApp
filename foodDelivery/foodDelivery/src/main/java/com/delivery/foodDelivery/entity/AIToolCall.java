package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ai_tool_calls", indexes = {
        @Index(name = "idx_ai_tool_msg_id", columnList = "message_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIToolCall extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private AIMessage message;

    @Column(name = "tool_name", nullable = false, length = 100)
    private String toolName;

    @Column(columnDefinition = "TEXT")
    private String arguments;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;
}
