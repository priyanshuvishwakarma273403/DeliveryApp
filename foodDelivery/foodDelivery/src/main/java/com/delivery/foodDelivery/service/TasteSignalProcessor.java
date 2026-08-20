package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.config.TasteDnaConfig;
import com.delivery.foodDelivery.dto.UserBehaviorEventDto;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TasteSignalProcessor {

    private final UserTasteProfileRepository tasteProfileRepository;
    private final UserTasteDimensionRepository tasteDimensionRepository;
    private final UserBehaviorEventRepository behaviorEventRepository;
    private final UserPreferenceOverrideRepository preferenceOverrideRepository;
    private final UserTasteHistoryRepository tasteHistoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    
    private final TasteDnaConfig tasteDnaConfig;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private static final double LAMBDA_CONSTANT = Math.log(2.0);

    /**
     * Process a behavioral event idempotently.
     */
    @Transactional
    public void processEvent(UserBehaviorEventDto eventDto) {
        log.info("Processing event: {} type: {} for user: {}", eventDto.getEventId(), eventDto.getEventType(), eventDto.getUserId());

        // 1. Idempotency Check
        if (behaviorEventRepository.findByEventId(eventDto.getEventId()).isPresent()) {
            log.warn("Event {} already processed. Skipping.", eventDto.getEventId());
            return;
        }

        // Parse user identifier
        String userIdStr = eventDto.getUserId();
        if (userIdStr == null || userIdStr.isEmpty()) {
            log.warn("Event {} has no userId. Skipping.", eventDto.getEventId());
            return;
        }

        Long userId;
        try {
            // Strip out "user-" prefix if present
            String cleanedId = userIdStr.replace("user-", "");
            userId = Long.parseLong(cleanedId);
        } catch (NumberFormatException e) {
            log.warn("Non-numeric user ID: {}. Falling back to default or skipping.", userIdStr);
            return;
        }

        // 2. Persist the raw behavior event
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(eventDto.getPayload());
        } catch (Exception e) {
            log.error("Failed to serialize event payload: {}", e.getMessage());
        }

        LocalDateTime eventTime = LocalDateTime.now();
        if (eventDto.getTimestamp() != null) {
            try {
                eventTime = LocalDateTime.parse(eventDto.getTimestamp(), DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception e) {
                // fallback
            }
        }

        UserBehaviorEvent behaviorEvent = UserBehaviorEvent.builder()
                .eventId(eventDto.getEventId())
                .userId(userId)
                .eventType(eventDto.getEventType())
                .payload(payloadJson)
                .processed(true)
                .createdAt(eventTime)
                .build();
        behaviorEventRepository.save(behaviorEvent);

        // 3. Retrieve or Create User Taste Profile
        UserTasteProfile profile = tasteProfileRepository.findByUserId(userIdStr)
                .orElseGet(() -> {
                    UserTasteProfile newProfile = UserTasteProfile.builder()
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
                    return tasteProfileRepository.save(newProfile);
                });

        // 4. Update Profile version and timestamp
        profile.setVersion(profile.getVersion() + 1);
        profile.setLastUpdated(LocalDateTime.now());

        // 5. Calculate decay and update dimension scores
        double weight = tasteDnaConfig.getWeight(eventDto.getEventType());
        double learningRate = tasteDnaConfig.getLearningRate();

        Map<String, Object> payload = eventDto.getPayload() != null ? eventDto.getPayload() : new HashMap<>();

        // Extract potential dishIds, restaurantId, and amount
        List<String> dishIds = new ArrayList<>();
        if (payload.containsKey("dishIds")) {
            Object dishesObj = payload.get("dishIds");
            if (dishesObj instanceof List) {
                for (Object item : (List<?>) dishesObj) {
                    dishIds.add(String.valueOf(item));
                }
            }
        } else if (payload.containsKey("dishId")) {
            dishIds.add(String.valueOf(payload.get("dishId")));
        }

        String restaurantId = payload.containsKey("restaurantId") ? String.valueOf(payload.get("restaurantId")) : null;
        
        Double amount = null;
        if (payload.containsKey("amount")) {
            try {
                amount = Double.parseDouble(String.valueOf(payload.get("amount")));
            } catch (Exception e) {}
        } else if (payload.containsKey("price")) {
            try {
                amount = Double.parseDouble(String.valueOf(payload.get("price")));
            } catch (Exception e) {}
        }

        // Apply global statistics updates if it's an order completed
        if ("USER_COMPLETED_ORDER".equals(eventDto.getEventType()) || "ORDER_COMPLETED".equals(eventDto.getEventType())) {
            if (amount != null) {
                double aov = profile.getAverageOrderValue() != null ? profile.getAverageOrderValue() : 0.0;
                long ordersCount = behaviorEventRepository.findAll().stream()
                        .filter(e -> e.getUserId().equals(userId) && ("USER_COMPLETED_ORDER".equals(e.getEventType()) || "ORDER_COMPLETED".equals(e.getEventType())))
                        .count();
                double newAov = (aov * (ordersCount - 1) + amount) / ordersCount;
                profile.setAverageOrderValue(newAov);

                double minP = profile.getMinPrice() != null ? profile.getMinPrice() : amount;
                double maxP = profile.getMaxPrice() != null ? profile.getMaxPrice() : amount;
                profile.setMinPrice(Math.min(minP, amount));
                profile.setMaxPrice(Math.max(maxP, amount));

                if (newAov < 250) {
                    profile.setBudgetTier("BUDGET");
                } else if (newAov > 600) {
                    profile.setBudgetTier("PREMIUM");
                } else {
                    profile.setBudgetTier("MEDIUM");
                }
            }
        }

        // Handle negative rating and explicit dislikes
        boolean isExplicitDislike = "USER_DISLIKED".equals(eventDto.getEventType()) || "DISLIKE".equals(eventDto.getEventType()) || "NEGATIVE_RATING".equals(eventDto.getEventType());

        // Perform decay on all dimensions for this user before applying the new signal
        decayAllDimensions(userId, eventTime);

        // Gather dimensions to update based on the signal
        List<TasteDimensionUpdate> updates = new ArrayList<>();

        // Process Restaurants
        if (restaurantId != null) {
            updates.add(new TasteDimensionUpdate("RESTAURANT", restaurantId, weight));
            
            // Increment frequentRestaurants count in profile
            int count = profile.getFrequentRestaurants().getOrDefault(restaurantId, 0);
            profile.getFrequentRestaurants().put(restaurantId, count + 1);

            restaurantRepository.findById(restaurantId).ifPresent(r -> {
                if (r.getCuisineType() != null) {
                    updates.add(new TasteDimensionUpdate("CUISINE", r.getCuisineType().toUpperCase(), weight));
                }
            });
        }

        // Process Dishes
        for (String dishId : dishIds) {
            updates.add(new TasteDimensionUpdate("DISH", dishId, weight));

            // Increment frequentItems count in profile
            int count = profile.getFrequentItems().getOrDefault(dishId, 0);
            profile.getFrequentItems().put(dishId, count + 1);

            menuItemRepository.findById(dishId).ifPresent(item -> {
                updates.add(new TasteDimensionUpdate("CATEGORY", item.getCategory().toUpperCase(), weight));

                // Dietary Preferences
                if (item.isVegetarian()) {
                    updates.add(new TasteDimensionUpdate("DIETARY", "VEGETARIAN", weight));
                } else {
                    updates.add(new TasteDimensionUpdate("DIETARY", "NON_VEG", weight));
                }

                // Flavor preferences inference
                String textToAnalyze = (item.getName() + " " + item.getDescription()).toLowerCase();
                if (textToAnalyze.contains("spicy") || textToAnalyze.contains("chili") || textToAnalyze.contains("chilli") || textToAnalyze.contains("hot") || textToAnalyze.contains("masala") || textToAnalyze.contains("curry") || textToAnalyze.contains("biryani") || textToAnalyze.contains("tikka")) {
                    updates.add(new TasteDimensionUpdate("FLAVOR", "SPICY", weight));
                }
                if (textToAnalyze.contains("sweet") || textToAnalyze.contains("dessert") || textToAnalyze.contains("chocolate") || textToAnalyze.contains("honey") || textToAnalyze.contains("ice cream") || textToAnalyze.contains("pastry") || textToAnalyze.contains("cake")) {
                    updates.add(new TasteDimensionUpdate("FLAVOR", "SWEET", weight));
                }
                if (textToAnalyze.contains("sour") || textToAnalyze.contains("lemon") || textToAnalyze.contains("lime") || textToAnalyze.contains("tangy") || textToAnalyze.contains("vinegar")) {
                    updates.add(new TasteDimensionUpdate("FLAVOR", "SOUR", weight));
                }
                if (textToAnalyze.contains("salty") || textToAnalyze.contains("salted") || textToAnalyze.contains("fries") || textToAnalyze.contains("crispy")) {
                    updates.add(new TasteDimensionUpdate("FLAVOR", "SALTY", weight));
                }

                // Dietary preferences inference
                if (textToAnalyze.contains("vegan") || textToAnalyze.contains("plant-based")) {
                    updates.add(new TasteDimensionUpdate("DIETARY", "VEGAN", weight));
                }
                if (textToAnalyze.contains("chicken") || textToAnalyze.contains("mutton") || textToAnalyze.contains("egg") || textToAnalyze.contains("protein") || textToAnalyze.contains("fish") || textToAnalyze.contains("paneer") || textToAnalyze.contains("tofu")) {
                    updates.add(new TasteDimensionUpdate("DIETARY", "HIGH_PROTEIN", weight));
                }

                // Handle negative ingredient exclusions automatically if explicitly disliked
                if (isExplicitDislike) {
                    if (textToAnalyze.contains("mushroom")) {
                        saveExplicitOverride(userId, "EXCLUDED_INGREDIENT", "MUSHROOM");
                    }
                    if (textToAnalyze.contains("paneer")) {
                        saveExplicitOverride(userId, "EXCLUDED_INGREDIENT", "PANEER");
                    }
                }
            });
        }

        // Apply updates to the database
        for (TasteDimensionUpdate update : updates) {
            updateDimensionScore(userId, update.type, update.key, update.weight, learningRate, eventDto.getEventId(), eventTime);
        }

        // Update Contextual profiles if context parameters are present
        String timeOfDay = (String) payload.get("timeOfDay");
        String weather = (String) payload.get("weather");

        if (timeOfDay != null) {
            for (String dishId : dishIds) {
                updateDimensionScore(userId, "TIME_OF_DAY", timeOfDay + ":" + dishId, weight, learningRate, eventDto.getEventId(), eventTime);
            }
        }
        if (weather != null) {
            for (String dishId : dishIds) {
                updateDimensionScore(userId, "WEATHER", weather + ":" + dishId, weight, learningRate, eventDto.getEventId(), eventTime);
            }
        }

        // Exploration vs Exploitation Scoring
        long uniqueRestaurantsVisited = profile.getFrequentRestaurants().size();
        long totalOrders = behaviorEventRepository.findAll().stream()
                .filter(e -> e.getUserId().equals(userId) && ("USER_COMPLETED_ORDER".equals(e.getEventType()) || "ORDER_COMPLETED".equals(e.getEventType())))
                .count();

        if (totalOrders > 0) {
            double explorationScore = (double) uniqueRestaurantsVisited / (double) totalOrders;
            profile.setExplorationScore(Math.min(1.0, explorationScore));
        }

        // Synchronize elements for backward compatibility lists
        syncPreferredLists(userId, profile);

        tasteProfileRepository.save(profile);

        // 6. Broadcast Real-Time updates via WebSocket
        sendWebSocketUpdate(userIdStr, profile);
    }

    private void syncPreferredLists(Long userId, UserTasteProfile profile) {
        List<UserTasteDimension> dimensions = tasteDimensionRepository.findByUserId(userId);
        
        List<String> preferredCuisines = dimensions.stream()
                .filter(d -> "CUISINE".equals(d.getDimensionType()) && d.getScore() > 0.4)
                .sorted((d1, d2) -> Double.compare(d2.getScore(), d1.getScore()))
                .map(UserTasteDimension::getDimensionKey)
                .collect(Collectors.toList());
        profile.setPreferredCuisines(preferredCuisines);

        List<String> preferredCategories = dimensions.stream()
                .filter(d -> "CATEGORY".equals(d.getDimensionType()) && d.getScore() > 0.4)
                .sorted((d1, d2) -> Double.compare(d2.getScore(), d1.getScore()))
                .map(UserTasteDimension::getDimensionKey)
                .collect(Collectors.toList());
        profile.setPreferredCategories(preferredCategories);

        List<String> dietaryPrefs = dimensions.stream()
                .filter(d -> "DIETARY".equals(d.getDimensionType()) && d.getScore() > 0.5)
                .sorted((d1, d2) -> Double.compare(d2.getScore(), d1.getScore()))
                .map(UserTasteDimension::getDimensionKey)
                .collect(Collectors.toList());
        profile.setDietaryPreferences(dietaryPrefs);
    }

    private void decayAllDimensions(Long userId, LocalDateTime currentTime) {
        List<UserTasteDimension> dimensions = tasteDimensionRepository.findByUserId(userId);
        double halfLife = tasteDnaConfig.getHalfLifeDays();
        double lambda = LAMBDA_CONSTANT / halfLife;

        for (UserTasteDimension dim : dimensions) {
            LocalDateTime lastUpdate = dim.getLastUpdated() != null ? dim.getLastUpdated() : currentTime.minusDays(1);
            double daysElapsed = Math.max(0.0, (double) Duration.between(lastUpdate, currentTime).toMinutes() / 1440.0);
            
            if (daysElapsed > 0) {
                double decayFactor = Math.exp(-lambda * daysElapsed);
                dim.setScore(dim.getScore() * decayFactor);
                dim.setLastUpdated(currentTime);
                tasteDimensionRepository.save(dim);
            }
        }
    }

    private void updateDimensionScore(Long userId, String type, String key, double weight, double learningRate, String sourceEventId, LocalDateTime currentTime) {
        UserTasteDimension dim = tasteDimensionRepository.findByUserIdAndDimensionTypeAndDimensionKey(userId, type, key)
                .orElseGet(() -> UserTasteDimension.builder()
                        .userId(userId)
                        .dimensionType(type)
                        .dimensionKey(key)
                        .score(0.0)
                        .lastUpdated(currentTime)
                        .build());

        double oldScore = dim.getScore();
        double newScore = oldScore + (weight * learningRate);
        
        // Clamp between 0.0 and 1.0
        newScore = Math.max(0.0, Math.min(1.0, newScore));
        
        dim.setScore(newScore);
        dim.setLastUpdated(currentTime);
        tasteDimensionRepository.save(dim);

        // Record history for audit trail / debugging (Section 32)
        UserTasteHistory history = UserTasteHistory.builder()
                .userId(userId)
                .version(1L) // version managed at profile level, this records detail
                .changedDimensionType(type)
                .changedDimensionKey(key)
                .oldValue(oldScore)
                .newValue(newScore)
                .sourceEventId(sourceEventId)
                .timestamp(currentTime)
                .build();
        tasteHistoryRepository.save(history);
    }

    private void saveExplicitOverride(Long userId, String key, String value) {
        List<UserPreferenceOverride> existing = preferenceOverrideRepository.findByUserIdAndPreferenceKey(userId, key);
        boolean alreadyExists = existing.stream().anyMatch(o -> o.getPreferenceValue().equalsIgnoreCase(value));
        if (!alreadyExists) {
            UserPreferenceOverride override = UserPreferenceOverride.builder()
                    .userId(userId)
                    .preferenceKey(key)
                    .preferenceValue(value.toUpperCase())
                    .createdAt(LocalDateTime.now())
                    .build();
            preferenceOverrideRepository.save(override);
            log.info("Explicit negative preference override created for user {}: {} -> {}", userId, key, value);
        }
    }

    private void sendWebSocketUpdate(String userIdStr, UserTasteProfile profile) {
        try {
            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("eventType", "TASTE_PROFILE_UPDATED");
            wsPayload.put("userId", userIdStr);
            wsPayload.put("timestamp", LocalDateTime.now().toString());
            wsPayload.put("version", profile.getVersion());
            
            // Build visual DNA presentation
            Map<String, Object> dnaDetails = new HashMap<>();
            dnaDetails.put("preferredCuisines", profile.getPreferredCuisines());
            dnaDetails.put("budgetTier", profile.getBudgetTier());
            dnaDetails.put("explorationScore", profile.getExplorationScore());
            wsPayload.put("tasteProfile", dnaDetails);

            messagingTemplate.convertAndSend("/topic/taste/" + userIdStr, wsPayload);
            log.info("Successfully published TASTE_PROFILE_UPDATED websocket event to /topic/taste/{}", userIdStr);
        } catch (Exception e) {
            log.error("Failed to publish websocket update: {}", e.getMessage());
        }
    }

    @AllArgsConstructor
    private static class TasteDimensionUpdate {
        String type;
        String key;
        double weight;
    }
}
