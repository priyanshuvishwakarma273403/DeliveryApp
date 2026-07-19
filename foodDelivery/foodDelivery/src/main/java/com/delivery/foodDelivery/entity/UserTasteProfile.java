package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "user_taste_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTasteProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Builder.Default
    private List<String> preferredCuisines = new ArrayList<>();

    @Builder.Default
    private List<String> preferredCategories = new ArrayList<>();

    @Builder.Default
    private Map<String, Integer> frequentItems = new HashMap<>(); // itemId -> count

    @Builder.Default
    private Map<String, Integer> frequentRestaurants = new HashMap<>(); // restaurantId -> count

    @Builder.Default
    private List<String> dietaryPreferences = new ArrayList<>(); // VEGETARIAN, VEGAN, JAIN, GLUTEN_FREE, HIGH_PROTEIN, LOW_CARB

    @Builder.Default
    private String budgetTier = "MEDIUM"; // BUDGET, MEDIUM, PREMIUM

    private Double averageRatingGiven;

    private LocalDateTime lastUpdated;
}
