package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationResponse {
    private String entityType; // "RESTAURANT" or "MENU_ITEM"
    private Object data; // RestaurantResponse or MenuItemResponse DTO
    private Double score;
    private String reason;
}
