package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.dto.UserBehaviorEventDto;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import com.delivery.foodDelivery.service.TasteDnaRecommendationEngine;
import com.delivery.foodDelivery.service.TasteSignalProcessor;
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
@RequestMapping("/api/v1/personalization")
@RequiredArgsConstructor
@Slf4j
public class PersonalizationController {

    private final UserRepository userRepository;
    private final UserTasteProfileRepository tasteProfileRepository;
    private final UserTasteDimensionRepository tasteDimensionRepository;
    private final UserPreferenceOverrideRepository preferenceOverrideRepository;
    private final RestaurantDigitalTwinStateRepository digitalTwinStateRepository;
    private final TasteDnaRecommendationEngine recommendationEngine;
    private final TasteSignalProcessor tasteSignalProcessor;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    @Data
    @Builder
    public static class HomeFeedResponse {
        private TasteDnaCard tasteDnaCard;
        private ContextBanner contextBanner;
        private Map<String, List<RecommendationItemDto>> sections;
    }

    @Data
    @Builder
    public static class TasteDnaCard {
        private List<String> preferredCuisines;
        private List<String> dietaryPreferences;
        private String budgetTier;
        private double explorationScore;
    }

    @Data
    @Builder
    public static class ContextBanner {
        private String weather;
        private String timeOfDay;
        private String location;
        private String restaurantHealthStatus;
        private String restaurantHealthMessage;
    }

    @Data
    @Builder
    public static class RecommendationItemDto {
        private String id;
        private String type; // "RESTAURANT" or "DISH"
        private Object data; // Restaurant or MenuItem details
        private double score;
        private List<String> reasonCodes;
        private int estimatedDeliveryMinutes;
    }

    @Data
    public static class FeedbackRequest {
        private String eventType;
        private String itemId;
        private String restaurantId;
        private Double rating;
        private Double amount;
        private Map<String, Object> additionalPayload;
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<HomeFeedResponse>> getHomeFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double budget) {

        log.info("Request for personalized home feed from userDetails: {}, param userId: {}", 
                userDetails != null ? userDetails.getUsername() : "anonymous", userId);

        // Resolve user
        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }
        if (user == null && userId != null && !userId.trim().isEmpty()) {
            try {
                Long id = Long.parseLong(userId.replace("user-", ""));
                user = userRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }

        String finalUserIdStr = (user != null) ? "user-" + user.getId() : "guest";

        // Fetch profile
        UserTasteProfile profile = null;
        if (user != null) {
            profile = tasteProfileRepository.findByUserId(finalUserIdStr).orElse(null);
        }
        if (profile == null) {
            profile = UserTasteProfile.builder()
                    .userId(finalUserIdStr)
                    .preferredCuisines(new ArrayList<>())
                    .preferredCategories(new ArrayList<>())
                    .dietaryPreferences(new ArrayList<>())
                    .frequentItems(new HashMap<>())
                    .frequentRestaurants(new HashMap<>())
                    .budgetTier("MEDIUM")
                    .explorationScore(0.5)
                    .build();
        }

        // Set up context
        String activeWeather = (weather != null && !weather.isEmpty()) ? weather : "NORMAL";
        String activeTimeOfDay = (timeOfDay != null && !timeOfDay.isEmpty()) ? timeOfDay : determineTimeOfDay();
        String activeLocation = (location != null && !location.isEmpty()) ? location : "Noida";

        // Compute restaurant health status
        List<RestaurantDigitalTwinState> twinStates = digitalTwinStateRepository.findAll();
        int avgHealth = 85;
        double avgSlaRisk = 0.1;
        if (!twinStates.isEmpty()) {
            double totalHealth = 0;
            double totalSlaRisk = 0;
            for (RestaurantDigitalTwinState state : twinStates) {
                totalHealth += (state.getHealthScore() != null) ? state.getHealthScore() : 80;
                totalSlaRisk += (state.getSlaRisk() != null) ? state.getSlaRisk() : 0.1;
            }
            avgHealth = (int) (totalHealth / twinStates.size());
            avgSlaRisk = totalSlaRisk / twinStates.size();
        }

        String healthStatus = "ALL_SYSTEMS_OPERATIONAL";
        String healthMessage = "All kitchen digital twins are running smoothly. Delivery times are optimal.";
        if (avgHealth < 60 || avgSlaRisk > 0.5) {
            healthStatus = "HIGH_WORKLOAD_AFFECTING_DELIVERY";
            healthMessage = "High kitchen workload detected. Delivery partner dispatch is delayed by 5-10 mins.";
        }

        // Get candidates from hybrid recommendation engine
        List<TasteDnaRecommendationEngine.RecommendationCandidate> candidates =
                recommendationEngine.getRecommendations(finalUserIdStr, activeWeather, activeTimeOfDay, activeLocation, budget);

        // Map candidates to RecommendationItemDto
        List<RecommendationItemDto> mappedItems = candidates.stream()
                .map(c -> {
                    int deliveryTime = 30;
                    if (c.getEntity() instanceof Restaurant) {
                        Integer avg = ((Restaurant) c.getEntity()).getAvgDeliveryTime();
                        deliveryTime = avg != null ? avg : 30;
                    } else if (c.getEntity() instanceof MenuItem) {
                        String rId = ((MenuItem) c.getEntity()).getRestaurantId();
                        Optional<Restaurant> restOpt = restaurantRepository.findById(rId);
                        if (restOpt.isPresent()) {
                            Integer avg = restOpt.get().getAvgDeliveryTime();
                            deliveryTime = avg != null ? avg : 30;
                        }
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

        // Separate sections
        List<RecommendationItemDto> quickAndHealthy = new ArrayList<>();
        List<RecommendationItemDto> exploration = new ArrayList<>();
        List<RecommendationItemDto> trendingNearYou = new ArrayList<>();
        List<RecommendationItemDto> contextualComfort = new ArrayList<>();

        for (RecommendationItemDto item : mappedItems) {
            boolean isDish = "DISH".equals(item.getType());
            
            // 1. Quick & Healthy
            if (isDish && item.getData() instanceof MenuItem) {
                MenuItem dish = (MenuItem) item.getData();
                boolean isHealthy = dish.isVegetarian() || 
                                    (dish.getDescription() != null && 
                                     (dish.getDescription().toLowerCase().contains("healthy") || 
                                      dish.getDescription().toLowerCase().contains("salad") ||
                                      dish.getDescription().toLowerCase().contains("protein") ||
                                      dish.getDescription().toLowerCase().contains("tofu") ||
                                      dish.getDescription().toLowerCase().contains("vegan")));
                if (isHealthy && item.getEstimatedDeliveryMinutes() < 35) {
                    quickAndHealthy.add(item);
                }
            }

            // 2. Exploration / Serendipity
            boolean isExplore = item.getReasonCodes() != null && 
                                (item.getReasonCodes().contains("NEARBY") || 
                                 item.getReasonCodes().contains("POPULAR_CHOICE"));
            if (isExplore) {
                exploration.add(item);
            }

            // 3. Trending Near You
            boolean isTrending = "RESTAURANT".equals(item.getType()) || 
                                 (item.getReasonCodes() != null && 
                                  (item.getReasonCodes().contains("TOP_RATED") || 
                                   item.getReasonCodes().contains("POPULAR_CHOICE")));
            if (isTrending) {
                trendingNearYou.add(item);
            }

            // 4. Contextual Comfort
            boolean isContext = item.getReasonCodes() != null && 
                                (item.getReasonCodes().contains("WEATHER_SPECIAL") || 
                                 item.getReasonCodes().contains("TIME_SPECIAL"));
            if (isContext) {
                contextualComfort.add(item);
            }
        }

        // Limit results per section to maintain premium look
        Map<String, List<RecommendationItemDto>> sections = new LinkedHashMap<>();
        sections.put("quickAndHealthy", quickAndHealthy.stream().limit(6).collect(Collectors.toList()));
        sections.put("exploration", exploration.stream().limit(6).collect(Collectors.toList()));
        sections.put("trendingNearYou", trendingNearYou.stream().limit(6).collect(Collectors.toList()));
        sections.put("contextualComfort", contextualComfort.stream().limit(6).collect(Collectors.toList()));

        // Taste DNA card mapping
        TasteDnaCard card = TasteDnaCard.builder()
                .preferredCuisines(profile.getPreferredCuisines())
                .dietaryPreferences(profile.getDietaryPreferences())
                .budgetTier(profile.getBudgetTier())
                .explorationScore(profile.getExplorationScore() != null ? profile.getExplorationScore() : 0.5)
                .build();

        // Context Banner mapping
        ContextBanner banner = ContextBanner.builder()
                .weather(activeWeather)
                .timeOfDay(activeTimeOfDay)
                .location(activeLocation)
                .restaurantHealthStatus(healthStatus)
                .restaurantHealthMessage(healthMessage)
                .build();

        HomeFeedResponse feed = HomeFeedResponse.builder()
                .tasteDnaCard(card)
                .contextBanner(banner)
                .sections(sections)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Home feed loaded successfully", feed));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<RecommendationItemDto>>> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double budget) {

        // Resolve user
        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }
        if (user == null && userId != null && !userId.trim().isEmpty()) {
            try {
                Long id = Long.parseLong(userId.replace("user-", ""));
                user = userRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }

        String finalUserIdStr = (user != null) ? "user-" + user.getId() : "guest";
        String activeWeather = (weather != null && !weather.isEmpty()) ? weather : "NORMAL";
        String activeTimeOfDay = (timeOfDay != null && !timeOfDay.isEmpty()) ? timeOfDay : determineTimeOfDay();
        String activeLocation = (location != null && !location.isEmpty()) ? location : "Noida";

        List<TasteDnaRecommendationEngine.RecommendationCandidate> candidates =
                recommendationEngine.getRecommendations(finalUserIdStr, activeWeather, activeTimeOfDay, activeLocation, budget);

        List<RecommendationItemDto> mappedItems = candidates.stream()
                .map(c -> {
                    int deliveryTime = 30;
                    if (c.getEntity() instanceof Restaurant) {
                        Integer avg = ((Restaurant) c.getEntity()).getAvgDeliveryTime();
                        deliveryTime = avg != null ? avg : 30;
                    } else if (c.getEntity() instanceof MenuItem) {
                        String rId = ((MenuItem) c.getEntity()).getRestaurantId();
                        Optional<Restaurant> restOpt = restaurantRepository.findById(rId);
                        if (restOpt.isPresent()) {
                            Integer avg = restOpt.get().getAvgDeliveryTime();
                            deliveryTime = avg != null ? avg : 30;
                        }
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

        return ResponseEntity.ok(ApiResponse.success("Recommendations generated successfully", mappedItems));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<String>> logFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FeedbackRequest request) {

        log.info("Received personalization feedback: {}", request);

        // Resolve user
        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }
        
        String userIdStr = "guest";
        if (user != null) {
            userIdStr = "user-" + user.getId();
        } else if (request.getAdditionalPayload() != null && request.getAdditionalPayload().containsKey("userId")) {
            userIdStr = String.valueOf(request.getAdditionalPayload().get("userId"));
        }

        // Construct UserBehaviorEventDto
        Map<String, Object> payload = new HashMap<>();
        if (request.getItemId() != null) {
            payload.put("dishId", request.getItemId());
        }
        if (request.getRestaurantId() != null) {
            payload.put("restaurantId", request.getRestaurantId());
        }
        if (request.getRating() != null) {
            payload.put("rating", request.getRating());
        }
        if (request.getAmount() != null) {
            payload.put("amount", request.getAmount());
        }
        if (request.getAdditionalPayload() != null) {
            payload.putAll(request.getAdditionalPayload());
        }

        UserBehaviorEventDto eventDto = UserBehaviorEventDto.builder()
                .eventId("feedback-" + UUID.randomUUID())
                .eventType(request.getEventType() != null ? request.getEventType() : "USER_VIEWED_DISH")
                .userId(userIdStr)
                .timestamp(LocalDateTime.now().toString())
                .payload(payload)
                .build();

        // Process directly
        tasteSignalProcessor.processEvent(eventDto);

        return ResponseEntity.ok(ApiResponse.success("Feedback processed successfully", "Taste DNA updated"));
    }

    private String determineTimeOfDay() {
        int hour = LocalDateTime.now().getHour();
        if (hour >= 5 && hour < 11) {
            return "BREAKFAST";
        } else if (hour >= 11 && hour < 16) {
            return "LUNCH";
        } else if (hour >= 16 && hour < 22) {
            return "DINNER";
        } else {
            return "LATE_NIGHT";
        }
    }
}
