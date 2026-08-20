package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.config.TasteDnaConfig;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.UserPreferenceOverrideRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteDimensionRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteProfileRepository;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TasteDnaRecommendationEngine {

    private final UserTasteProfileRepository tasteProfileRepository;
    private final UserTasteDimensionRepository tasteDimensionRepository;
    private final UserPreferenceOverrideRepository preferenceOverrideRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final TasteDnaConfig tasteDnaConfig;

    @Data
    @Builder
    public static class RecommendationCandidate {
        private String id;
        private String type; // "RESTAURANT" or "DISH"
        private Object entity; // Restaurant or MenuItem
        private double score;
        private List<String> reasonCodes;
    }

    /**
     * Get hyper-personalized dynamic recommendations.
     */
    public List<RecommendationCandidate> getRecommendations(
            String userIdStr, String weather, String timeOfDay, String location, Double budgetLimit) {

        log.info("Generating recommendations for user: {} context: [weather={}, timeOfDay={}, location={}, budgetLimit={}]",
                userIdStr, weather, timeOfDay, location, budgetLimit);

        // Clean user id
        Long userId = null;
        if (userIdStr != null) {
            try {
                userId = Long.parseLong(userIdStr.replace("user-", ""));
            } catch (NumberFormatException ignored) {}
        }

        // Fetch user profile and dimensions
        UserTasteProfile profile = null;
        List<UserTasteDimension> dimensions = new ArrayList<>();
        List<UserPreferenceOverride> overrides = new ArrayList<>();

        if (userId != null) {
            final Long finalUserId = userId;
            profile = tasteProfileRepository.findByUserId(userIdStr).orElse(null);
            dimensions = tasteDimensionRepository.findByUserId(finalUserId);
            overrides = preferenceOverrideRepository.findByUserId(finalUserId);
        }

        // 1. CANDIDATE GENERATION (Section 17)
        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        List<MenuItem> allMenuItems = menuItemRepository.findAll();

        List<RecommendationCandidate> candidates = new ArrayList<>();

        // Map dimensions for O(1) lookups
        Map<String, Double> dimensionMap = dimensions.stream()
                .collect(Collectors.toMap(
                        d -> d.getDimensionType() + ":" + d.getDimensionKey(),
                        UserTasteDimension::getScore,
                        (s1, s2) -> s1
                ));

        // 2. HARD FILTERS (Section 18)
        Set<String> excludedIngredients = overrides.stream()
                .filter(o -> "EXCLUDED_INGREDIENT".equals(o.getPreferenceKey()))
                .map(o -> o.getPreferenceValue().toUpperCase())
                .collect(Collectors.toSet());

        boolean forceVegetarian = overrides.stream()
                .anyMatch(o -> "DIETARY_PREF".equals(o.getPreferenceKey()) && "VEGETARIAN".equals(o.getPreferenceValue()));

        // Process Restaurants candidates
        for (Restaurant r : allRestaurants) {
            if (!r.isOpen()) continue; // Closed filter
            if (location != null && r.getCity() != null && !r.getCity().equalsIgnoreCase(location)) continue;

            // Score restaurant
            double score = scoreRestaurant(r, profile, dimensionMap);
            List<String> reasonCodes = getRestaurantReasonCodes(r, profile, dimensionMap);

            candidates.add(RecommendationCandidate.builder()
                    .id(r.getId())
                    .type("RESTAURANT")
                    .entity(r)
                    .score(score)
                    .reasonCodes(reasonCodes)
                    .build());
        }

        // Process Dish candidates
        for (MenuItem item : allMenuItems) {
            if (!item.isAvailable()) continue; // Unavailable filter
            
            // Excluded ingredients filter
            String text = (item.getName() + " " + item.getDescription()).toUpperCase();
            boolean isExcluded = excludedIngredients.stream().anyMatch(text::contains);
            if (isExcluded) continue;

            // Dietary filter
            if (forceVegetarian && !item.isVegetarian()) continue;

            // Budget filter
            if (budgetLimit != null && item.getPrice() > budgetLimit) continue;
            if (profile != null && profile.getMaxPrice() != null && item.getPrice() > profile.getMaxPrice() * 1.5) continue;

            // Score dish
            double score = scoreDish(item, profile, dimensionMap, weather, timeOfDay);
            List<String> reasonCodes = getDishReasonCodes(item, profile, dimensionMap, weather, timeOfDay);

            candidates.add(RecommendationCandidate.builder()
                    .id(item.getId())
                    .type("DISH")
                    .entity(item)
                    .score(score)
                    .reasonCodes(reasonCodes)
                    .build());
        }

        // 3. RANKING & EXPLORATION (Section 14, 20)
        double explorationScore = profile != null && profile.getExplorationScore() != null ? profile.getExplorationScore() : 0.5;
        double explorationRatio = tasteDnaConfig.getExplorationRatio() * explorationScore;

        Random random = new Random();
        boolean isExplorationTurn = random.nextDouble() < explorationRatio;

        List<RecommendationCandidate> ranked = candidates.stream()
                .sorted((c1, c2) -> {
                    double s1 = c1.getScore();
                    double s2 = c2.getScore();

                    // If exploration turn, boost items user hasn't tried much (low dimension score)
                    if (isExplorationTurn) {
                        double tryScore1 = getTryScore(c1, dimensionMap);
                        double tryScore2 = getTryScore(c2, dimensionMap);
                        s1 += tryScore1 * 0.3;
                        s2 += tryScore2 * 0.3;
                    }

                    return Double.compare(s2, s1);
                })
                .collect(Collectors.toList());

        // 4. DIVERSITY FILTERING (Section 19)
        List<RecommendationCandidate> diverseRecommendations = new ArrayList<>();
        Map<String, Integer> restaurantCounts = new HashMap<>();
        Map<String, Integer> categoryCounts = new HashMap<>();

        for (RecommendationCandidate cand : ranked) {
            String restId = "";
            String category = "";

            if ("RESTAURANT".equals(cand.getType())) {
                restId = cand.getId();
            } else if ("DISH".equals(cand.getType()) && cand.getEntity() instanceof MenuItem) {
                MenuItem item = (MenuItem) cand.getEntity();
                restId = item.getRestaurantId();
                category = item.getCategory() != null ? item.getCategory() : "UNKNOWN";
            }

            int rCount = restaurantCounts.getOrDefault(restId, 0);
            int cCount = categoryCounts.getOrDefault(category, 0);

            // Limit same restaurant to 2 recommendations, same category to 3 in the final feed
            if (rCount < 2 && cCount < 3) {
                diverseRecommendations.add(cand);
                restaurantCounts.put(restId, rCount + 1);
                if (!category.isEmpty()) {
                    categoryCounts.put(category, cCount + 1);
                }
            }

            // Target 15 premium recommendations
            if (diverseRecommendations.size() >= 15) {
                break;
            }
        }

        return diverseRecommendations;
    }

    private double getTryScore(RecommendationCandidate c, Map<String, Double> dimensionMap) {
        if ("RESTAURANT".equals(c.getType())) {
            double score = dimensionMap.getOrDefault("RESTAURANT:" + c.getId(), 0.0);
            return 1.0 - score; // higher if score is low
        } else {
            double score = dimensionMap.getOrDefault("DISH:" + c.getId(), 0.0);
            return 1.0 - score;
        }
    }

    private double scoreRestaurant(Restaurant r, UserTasteProfile profile, Map<String, Double> dimensionMap) {
        double score = 0.0;
        
        // Base rating
        if (r.getRating() != null) {
            score += r.getRating() * 0.1;
        }

        // Cuisine match
        if (r.getCuisineType() != null) {
            score += dimensionMap.getOrDefault("CUISINE:" + r.getCuisineType().toUpperCase(), 0.0) * 0.5;
        }

        // Restaurant familiarity / preference
        score += dimensionMap.getOrDefault("RESTAURANT:" + r.getId(), 0.0) * 0.4;

        return score;
    }

    private double scoreDish(MenuItem item, UserTasteProfile profile, Map<String, Double> dimensionMap, String weather, String timeOfDay) {
        double score = 0.0;

        // Base rating/popularity (fallback default)
        score += 0.2;

        // Category/Vegetarian preferences
        if (item.isVegetarian()) {
            score += dimensionMap.getOrDefault("DIETARY:VEGETARIAN", 0.0) * 0.3;
        } else {
            score += dimensionMap.getOrDefault("DIETARY:NON_VEG", 0.0) * 0.3;
        }

        // Cuisine matching via restaurant
        Optional<Restaurant> restOpt = restaurantRepository.findById(item.getRestaurantId());
        if (restOpt.isPresent()) {
            Restaurant r = restOpt.get();
            if (r.getCuisineType() != null) {
                score += dimensionMap.getOrDefault("CUISINE:" + r.getCuisineType().toUpperCase(), 0.0) * 0.4;
            }
        }

        // Specific category match
        if (item.getCategory() != null) {
            score += dimensionMap.getOrDefault("CATEGORY:" + item.getCategory().toUpperCase(), 0.0) * 0.3;
        }

        // Specific dish match
        score += dimensionMap.getOrDefault("DISH:" + item.getId(), 0.0) * 0.5;

        // Contextual boost (Section 9, 10, 11)
        if (timeOfDay != null) {
            score += dimensionMap.getOrDefault("TIME_OF_DAY:" + timeOfDay + ":" + item.getId(), 0.0) * 0.4;
        }
        if (weather != null) {
            score += dimensionMap.getOrDefault("WEATHER:" + weather + ":" + item.getId(), 0.0) * 0.4;
        }

        // Budget tier preference match
        if (profile != null && profile.getAverageOrderValue() != null) {
            double diff = Math.abs(item.getPrice() - profile.getAverageOrderValue());
            score += Math.max(0.0, 0.2 - (diff / profile.getAverageOrderValue() * 0.2));
        }

        return score;
    }

    private List<String> getRestaurantReasonCodes(Restaurant r, UserTasteProfile profile, Map<String, Double> dimensionMap) {
        List<String> codes = new ArrayList<>();
        if (r.getCuisineType() != null && dimensionMap.getOrDefault("CUISINE:" + r.getCuisineType().toUpperCase(), 0.0) > 0.6) {
            codes.add("FAVORITE_CUISINE");
        }
        if (dimensionMap.getOrDefault("RESTAURANT:" + r.getId(), 0.0) > 0.6) {
            codes.add("SIMILAR_TO_FAVORITE");
        }
        if (r.getRating() != null && r.getRating() >= 4.5) {
            codes.add("TOP_RATED");
        }
        if (codes.isEmpty()) {
            codes.add("NEARBY");
        }
        return codes;
    }

    private List<String> getDishReasonCodes(MenuItem item, UserTasteProfile profile, Map<String, Double> dimensionMap, String weather, String timeOfDay) {
        List<String> codes = new ArrayList<>();

        if (dimensionMap.getOrDefault("DISH:" + item.getId(), 0.0) > 0.6) {
            codes.add("SIMILAR_TO_FAVORITE");
        }

        // Flavors check
        String text = (item.getName() + " " + item.getDescription()).toLowerCase();
        if (text.contains("spicy") && dimensionMap.getOrDefault("FLAVOR:SPICY", 0.0) > 0.6) {
            codes.add("SPICY_PREFERENCE");
        }

        if (profile != null && profile.getAverageOrderValue() != null && item.getPrice() <= profile.getAverageOrderValue()) {
            codes.add("WITHIN_BUDGET");
        }

        if (timeOfDay != null && dimensionMap.getOrDefault("TIME_OF_DAY:" + timeOfDay + ":" + item.getId(), 0.0) > 0.5) {
            codes.add("TIME_SPECIAL");
        }

        if (weather != null && dimensionMap.getOrDefault("WEATHER:" + weather + ":" + item.getId(), 0.0) > 0.5) {
            codes.add("WEATHER_SPECIAL");
        }

        if (codes.isEmpty()) {
            codes.add("POPULAR_CHOICE");
        }

        return codes;
    }
}
