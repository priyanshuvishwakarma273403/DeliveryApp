package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.response.AiRecommendationResponse;
import com.delivery.foodDelivery.dto.response.AiToolDtos.*;
import com.delivery.foodDelivery.dto.response.ExtractedIntentContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FoodConciergeRankingEngine {

    @Value("${foodiq.ranking.weights.preference-match:0.25}")
    private double wPreferenceMatch;

    @Value("${foodiq.ranking.weights.cuisine-match:0.15}")
    private double wCuisineMatch;

    @Value("${foodiq.ranking.weights.budget-match:0.15}")
    private double wBudgetMatch;

    @Value("${foodiq.ranking.weights.delivery-score:0.15}")
    private double wDeliveryScore;

    @Value("${foodiq.ranking.weights.rating-score:0.10}")
    private double wRatingScore;

    @Value("${foodiq.ranking.weights.distance-score:0.10}")
    private double wDistanceScore;

    @Value("${foodiq.ranking.weights.popularity-score:0.10}")
    private double wPopularityScore;

    public List<AiRecommendationResponse> rankRestaurants(
            List<RestaurantToolDto> restaurants,
            UserTasteProfileToolDto profile,
            ExtractedIntentContext intent) {
        
        log.info("Ranking {} restaurants using configured weights", restaurants.size());
        
        return restaurants.stream()
                .map(r -> {
                    double preferenceMatch = calculateRestaurantPreferenceMatch(r, profile);
                    double cuisineMatch = calculateRestaurantCuisineMatch(r, intent, profile);
                    double budgetMatch = calculateRestaurantBudgetMatch(r, intent, profile);
                    
                    // Mock distance
                    double distanceKm = 1.0 + (Math.abs(r.getId().hashCode()) % 5);
                    double distanceScore = Math.max(0.0, 1.0 - (distanceKm / 8.0));
                    
                    int eta = r.getAvgDeliveryTime() != null ? r.getAvgDeliveryTime() : 35;
                    double deliveryScore = Math.max(0.0, 1.0 - (eta / 60.0));
                    
                    double ratingScore = r.getRating() != null ? r.getRating() / 5.0 : 0.7;
                    
                    double popularity = profile.getFrequentRestaurants() != null ?
                            profile.getFrequentRestaurants().getOrDefault(r.getId(), 0) : 0;
                    double popularityScore = Math.min(1.0, 0.5 + (popularity * 0.1));

                    double finalScore = (wPreferenceMatch * preferenceMatch)
                            + (wCuisineMatch * cuisineMatch)
                            + (wBudgetMatch * budgetMatch)
                            + (wDeliveryScore * deliveryScore)
                            + (wRatingScore * ratingScore)
                            + (wDistanceScore * distanceScore)
                            + (wPopularityScore * popularityScore);

                    // Build explainable reason
                    List<String> reasons = new ArrayList<>();
                    if (cuisineMatch > 0.8 && r.getCuisine() != null) {
                        reasons.add("Matches your requested " + r.getCuisine() + " cuisine");
                    } else if (preferenceMatch > 0.8) {
                        reasons.add("Based on your frequent visits");
                    }
                    
                    if (budgetMatch > 0.8) {
                        reasons.add("Fits within budget (Min Order: ₹" + Math.round(r.getMinOrderAmount()) + ")");
                    }
                    
                    if (eta <= 30) {
                        reasons.add("Quick delivery in " + eta + " mins");
                    }
                    
                    if (r.getRating() != null && r.getRating() >= 4.5) {
                        reasons.add("Highly rated (" + r.getRating() + " ⭐)");
                    }

                    String reasonStr = reasons.isEmpty() ? "Popular option in your city" : String.join(", ", reasons);

                    return AiRecommendationResponse.builder()
                            .entityType("RESTAURANT")
                            .data(r)
                            .score(Math.round(finalScore * 100.0) / 100.0)
                            .reason(reasonStr)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .collect(Collectors.toList());
    }

    public List<AiRecommendationResponse> rankDishes(
            List<DishToolDto> dishes,
            UserTasteProfileToolDto profile,
            ExtractedIntentContext intent) {
        
        log.info("Ranking {} dishes using configured weights", dishes.size());
        
        return dishes.stream()
                .map(d -> {
                    double preferenceMatch = calculateDishPreferenceMatch(d, profile);
                    double cuisineMatch = calculateDishCuisineMatch(d, intent, profile);
                    double budgetMatch = calculateDishBudgetMatch(d, intent, profile);
                    
                    // Mock distance/eta from restaurant
                    double distanceKm = 1.0 + (Math.abs(d.getRestaurantId().hashCode()) % 5);
                    double distanceScore = Math.max(0.0, 1.0 - (distanceKm / 8.0));
                    
                    double deliveryScore = 0.7; // default
                    double ratingScore = 0.8; // default
                    double popularityScore = 0.5;

                    double finalScore = (wPreferenceMatch * preferenceMatch)
                            + (wCuisineMatch * cuisineMatch)
                            + (wBudgetMatch * budgetMatch)
                            + (wDeliveryScore * deliveryScore)
                            + (wRatingScore * ratingScore)
                            + (wDistanceScore * distanceScore)
                            + (wPopularityScore * popularityScore);

                    // Build explainable reasons
                    List<String> reasons = new ArrayList<>();
                    if (intent.getDishes() != null && intent.getDishes().stream().anyMatch(n -> d.getName().toLowerCase().contains(n.toLowerCase()))) {
                        reasons.add("Matches your specific craving");
                    }
                    if (budgetMatch > 0.8) {
                        reasons.add("Within budget (₹" + Math.round(d.getPrice()) + ")");
                    }
                    if (d.isVegetarian()) {
                        reasons.add("Pure Vegetarian option");
                    }
                    if (preferenceMatch > 0.8) {
                        reasons.add("You've ordered this before");
                    }

                    String reasonStr = reasons.isEmpty() ? "Highly recommended choice" : String.join(", ", reasons);

                    return AiRecommendationResponse.builder()
                            .entityType("MENU_ITEM")
                            .data(d)
                            .score(Math.round(finalScore * 100.0) / 100.0)
                            .reason(reasonStr)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .collect(Collectors.toList());
    }

    private double calculateRestaurantPreferenceMatch(RestaurantToolDto r, UserTasteProfileToolDto profile) {
        if (profile == null) return 0.0;
        if (profile.getFrequentRestaurants() != null && profile.getFrequentRestaurants().containsKey(r.getId())) {
            return 1.0;
        }
        if (profile.getPreferredCuisines() != null && profile.getPreferredCuisines().contains(r.getCuisine())) {
            return 0.6;
        }
        return 0.0;
    }

    private double calculateRestaurantCuisineMatch(RestaurantToolDto r, ExtractedIntentContext intent, UserTasteProfileToolDto profile) {
        if (intent.getCuisines() != null && !intent.getCuisines().isEmpty()) {
            boolean match = intent.getCuisines().stream()
                    .anyMatch(c -> r.getCuisine() != null && r.getCuisine().equalsIgnoreCase(c));
            if (match) return 1.0;
        }
        if (profile != null && profile.getPreferredCuisines() != null && profile.getPreferredCuisines().contains(r.getCuisine())) {
            return 0.5;
        }
        return 0.0;
    }

    private double calculateRestaurantBudgetMatch(RestaurantToolDto r, ExtractedIntentContext intent, UserTasteProfileToolDto profile) {
        double minOrder = r.getMinOrderAmount() != null ? r.getMinOrderAmount() : 0.0;
        if (intent.getBudgetMax() != null) {
            if (minOrder <= intent.getBudgetMax()) {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        if (profile != null && profile.getBudgetTier() != null) {
            if ("BUDGET".equalsIgnoreCase(profile.getBudgetTier()) && minOrder <= 150) return 0.9;
            if ("MEDIUM".equalsIgnoreCase(profile.getBudgetTier()) && minOrder <= 300) return 0.9;
            if ("PREMIUM".equalsIgnoreCase(profile.getBudgetTier())) return 1.0;
        }
        return 0.7;
    }

    private double calculateDishPreferenceMatch(DishToolDto d, UserTasteProfileToolDto profile) {
        if (profile == null) return 0.0;
        if (profile.getPreferredCategories() != null && profile.getPreferredCategories().contains(d.getCategory())) {
            return 0.8;
        }
        return 0.0;
    }

    private double calculateDishCuisineMatch(DishToolDto d, ExtractedIntentContext intent, UserTasteProfileToolDto profile) {
        if (intent.getCuisines() != null && !intent.getCuisines().isEmpty()) {
            // Check category match or simple heuristic
            boolean match = intent.getCuisines().stream()
                    .anyMatch(c -> d.getCategory() != null && d.getCategory().equalsIgnoreCase(c));
            if (match) return 1.0;
        }
        return 0.0;
    }

    private double calculateDishBudgetMatch(DishToolDto d, ExtractedIntentContext intent, UserTasteProfileToolDto profile) {
        double price = d.getPrice() != null ? d.getPrice() : 0.0;
        if (intent.getBudgetMax() != null) {
            if (price <= intent.getBudgetMax()) {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        if (profile != null && profile.getBudgetTier() != null) {
            if ("BUDGET".equalsIgnoreCase(profile.getBudgetTier()) && price <= 200) return 0.9;
            if ("MEDIUM".equalsIgnoreCase(profile.getBudgetTier()) && price <= 400) return 0.9;
            if ("PREMIUM".equalsIgnoreCase(profile.getBudgetTier())) return 1.0;
        }
        return 0.7;
    }
}
