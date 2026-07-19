package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "recommendation_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationCampaign {

    @Id
    private String id;

    private String name;

    private String type; // e.g. "BOOST_RESTAURANT", "BOOST_FOOD", "BOOST_CATEGORY", "PIN_RECOMMENDATION"

    private String targetId; // restaurantId, foodItemName, or categoryName

    @Builder.Default
    private Double boostMultiplier = 1.0;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}
