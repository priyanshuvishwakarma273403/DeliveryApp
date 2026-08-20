package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessageResponse {
    private UUID conversationId;
    private String response;
    private String intent;
    private List<AiRecommendationResponse> recommendations;
    private CartResponse draftCart;
    private String status;
}
