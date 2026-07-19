package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "recommendation_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationMetric {

    @Id
    private String id;

    private String strategy; // e.g. "STRATEGY_A", "STRATEGY_B"

    private String userId;

    private String itemId; // e.g. restaurantId or foodItemId

    private String action; // e.g. "IMPRESSION", "CLICK", "CONVERSION"

    private LocalDateTime timestamp;
}
