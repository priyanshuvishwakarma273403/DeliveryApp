package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConversationSummaryResponse {
    private UUID conversationId;
    private Long userId;
    private String lastMessage;
    private String lastIntent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
