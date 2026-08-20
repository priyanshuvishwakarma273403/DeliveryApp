package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteProfileRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteDimensionRepository;
import com.delivery.foodDelivery.repository.jpa.UserPreferenceOverrideRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteHistoryRepository;
import com.delivery.foodDelivery.service.TasteDnaRecommendationEngine;
import com.delivery.foodDelivery.service.TasteSignalProcessor;
import com.delivery.foodDelivery.service.TasteDnaCacheService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/users/me")
@RequiredArgsConstructor
@Slf4j
public class UserTasteDnaController {

    private final UserRepository userRepository;
    private final UserTasteProfileRepository tasteProfileRepository;
    private final UserTasteDimensionRepository tasteDimensionRepository;
    private final UserPreferenceOverrideRepository preferenceOverrideRepository;
    private final UserTasteHistoryRepository tasteHistoryRepository;
    private final TasteDnaRecommendationEngine recommendationEngine;
    private final TasteDnaCacheService cacheService;

    @Data
    public static class PreferenceRequest {
        private List<String> preferredCuisines;
        private List<String> dietaryPreferences;
        private List<String> excludedIngredients;
        private String budgetTier;
        private Double budgetLimit;
    }

    @Data
    @Builder
    public static class RecommendationResponse {
        private Map<String, Object> context;
        private List<RecommendationItemDto> recommendations;
    }

    @Data
    @Builder
    public static class RecommendationItemDto {
        private String id;
        private String type; // "RESTAURANT" or "DISH"
        private Object data; // MenuItem or Restaurant entity details
        private double score;
        private List<String> reasonCodes;
        private int estimatedDeliveryMinutes;
    }

    @GetMapping("/taste-dna")
    public ResponseEntity<?> getTasteDna(@AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        String userIdStr = "user-" + user.getId();

        // Try getting from cache (Section 23)
        UserTasteProfile profile = cacheService.getProfile(userIdStr);
        if (profile == null) {
            profile = tasteProfileRepository.findByUserId(userIdStr)
                    .orElseGet(() -> createDefaultProfile(userIdStr));
            cacheService.putProfile(userIdStr, profile);
        }

        List<UserTasteDimension> dimensions = tasteDimensionRepository.findByUserId(user.getId());
        List<UserPreferenceOverride> overrides = preferenceOverrideRepository.findByUserId(user.getId());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", profile);
        response.put("dimensions", dimensions);
        response.put("overrides", overrides);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<RecommendationResponse> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double budget) {

        User user = resolveUser(userDetails);
        String userIdStr = "user-" + user.getId();

        // Generate recommendations
        List<TasteDnaRecommendationEngine.RecommendationCandidate> candidates =
                recommendationEngine.getRecommendations(userIdStr, weather, timeOfDay, location, budget);

        List<RecommendationItemDto> items = candidates.stream()
                .map(c -> {
                    int deliveryTime = 30;
                    if (c.getEntity() instanceof Restaurant) {
                        Integer avg = ((Restaurant) c.getEntity()).getAvgDeliveryTime();
                        deliveryTime = avg != null ? avg : 30;
                    }
                    return RecommendationItemDto.builder()
                            .id(c.getId())
                            .type(c.getType())
                            .data(c.getEntity())
                            .score(c.getScore())
                            .reasonCodes(c.getReasonCodes())
                            .estimatedDeliveryMinutes(deliveryTime)
                            .build();
                })
                .collect(Collectors.toList());

        Map<String, Object> contextMap = new HashMap<>();
        contextMap.put("weather", weather != null ? weather : "NORMAL");
        contextMap.put("timeOfDay", timeOfDay != null ? timeOfDay : "NORMAL");
        contextMap.put("location", location != null ? location : "USER_HOME");
        contextMap.put("budget", budget);

        return ResponseEntity.ok(RecommendationResponse.builder()
                .context(contextMap)
                .recommendations(items)
                .build());
    }

    @GetMapping("/recommendations/{context}")
    public ResponseEntity<RecommendationResponse> getRecommendationsWithPreset(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String context,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double budget) {

        String weather = null;
        String timeOfDay = null;

        // Preset mapping (Section 10, 11)
        if ("RAINY".equalsIgnoreCase(context) || "SNOWY".equalsIgnoreCase(context)) {
            weather = "RAINY";
        } else if ("SUMMER".equalsIgnoreCase(context) || "HOT".equalsIgnoreCase(context)) {
            weather = "HOT";
        } else if ("DINNER".equalsIgnoreCase(context) || "LATE_NIGHT".equalsIgnoreCase(context)) {
            timeOfDay = "DINNER";
        } else if ("LUNCH".equalsIgnoreCase(context)) {
            timeOfDay = "LUNCH";
        } else if ("BREAKFAST".equalsIgnoreCase(context)) {
            timeOfDay = "BREAKFAST";
        }

        return getRecommendations(userDetails, weather, timeOfDay, location, budget);
    }

    @PostMapping("/preferences")
    public ResponseEntity<?> savePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PreferenceRequest request) {

        User user = resolveUser(userDetails);
        String userIdStr = "user-" + user.getId();

        // Update taste profile
        UserTasteProfile profile = tasteProfileRepository.findByUserId(userIdStr)
                .orElseGet(() -> createDefaultProfile(userIdStr));

        if (request.getBudgetTier() != null) {
            profile.setBudgetTier(request.getBudgetTier());
        }
        profile.setVersion(profile.getVersion() + 1);
        profile.setLastUpdated(LocalDateTime.now());
        tasteProfileRepository.save(profile);

        // Update overrides (Section 27)
        // Clear old ones first
        preferenceOverrideRepository.deleteByUserId(user.getId());

        if (request.getPreferredCuisines() != null) {
            for (String cuisine : request.getPreferredCuisines()) {
                preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                        .userId(user.getId())
                        .preferenceKey("FAVORITE_CUISINES")
                        .preferenceValue(cuisine.toUpperCase())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        if (request.getDietaryPreferences() != null) {
            for (String dietary : request.getDietaryPreferences()) {
                preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                        .userId(user.getId())
                        .preferenceKey("DIETARY_PREF")
                        .preferenceValue(dietary.toUpperCase())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        if (request.getExcludedIngredients() != null) {
            for (String ingredient : request.getExcludedIngredients()) {
                preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                        .userId(user.getId())
                        .preferenceKey("EXCLUDED_INGREDIENT")
                        .preferenceValue(ingredient.toUpperCase())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        if (request.getBudgetLimit() != null) {
            preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                    .userId(user.getId())
                    .preferenceKey("BUDGET_LIMIT")
                    .preferenceValue(String.valueOf(request.getBudgetLimit()))
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // Evict cache
        cacheService.evictProfile(userIdStr);

        return ResponseEntity.ok(Map.of("message", "Preferences updated successfully"));
    }

    @DeleteMapping("/taste-data")
    public ResponseEntity<?> deleteTasteData(@AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        String userIdStr = "user-" + user.getId();

        // Delete all dimensions, overrides, history, profile
        tasteDimensionRepository.deleteAll(tasteDimensionRepository.findByUserId(user.getId()));
        preferenceOverrideRepository.deleteByUserId(user.getId());
        tasteHistoryRepository.deleteAll(tasteHistoryRepository.findByUserId(user.getId()));

        UserTasteProfile profile = tasteProfileRepository.findByUserId(userIdStr).orElse(null);
        if (profile != null) {
            tasteProfileRepository.delete(profile);
        }

        // Evict cache
        cacheService.evictProfile(userIdStr);

        return ResponseEntity.ok(Map.of("message", "Taste DNA profile and history deleted successfully"));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException("Unauthorized");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    private UserTasteProfile createDefaultProfile(String userIdStr) {
        return UserTasteProfile.builder()
                .userId(userIdStr)
                .preferredCuisines(new ArrayList<>())
                .preferredCategories(new ArrayList<>())
                .frequentItems(new HashMap<>())
                .frequentRestaurants(new HashMap<>())
                .dietaryPreferences(new ArrayList<>())
                .budgetTier("MEDIUM")
                .explorationScore(0.5)
                .version(1L)
                .lastUpdated(LocalDateTime.now())
                .build();
    }
}
