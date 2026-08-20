package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedIntentContext {
    private String intent; // e.g. "FOOD_DISCOVERY", "RESTAURANT_SEARCH"
    
    @Builder.Default
    private List<String> cuisines = new ArrayList<>();
    
    @Builder.Default
    private List<String> dishes = new ArrayList<>();
    
    private Double budgetMin;
    private Double budgetMax;
    private Integer peopleCount;
    
    @Builder.Default
    private List<String> dietaryPreferences = new ArrayList<>(); // e.g. "VEGETARIAN", "VEGAN"
    
    private String spiceLevel; // "LOW", "MEDIUM", "HIGH"
    private Integer maxDeliveryTimeMinutes;
    private String location;
    private String mealType; // "BREAKFAST", "LUNCH", "DINNER", "SNACKS"
    
    @Builder.Default
    private List<String> excludedIngredients = new ArrayList<>();
    
    @Builder.Default
    private List<String> allergies = new ArrayList<>();
    
    private String restaurantPreference;
    private Double ratingPreference;
}
