package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.mongo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final UserTasteProfileRepository tasteProfileRepository;
    private final RecommendationCampaignRepository campaignRepository;
    private final RecommendationMetricRepository metricRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    // DTO to provide explainable AI context and tracking strategy
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RecommendationResult {
        private String type; // "RESTAURANT" or "MENU_ITEM"
        private Object data; // The actual Restaurant or MenuItem entity
        private String reason; // Explainable AI text e.g., "Trending in Noida"
        private String strategy; // "STRATEGY_A" or "STRATEGY_B" (for A/B testing)
    }

    // DTO for Combos and Upgrades
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SmartCombo {
        private String name;
        private List<MenuItem> items;
        private Double originalPrice;
        private Double comboPrice;
        private String description;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. DYNAMIC HOME FEED RECOMMENDATIONS
    // ────────────────────────────────────────────────────────────────────────
    public Map<String, List<RecommendationResult>> getHomeRecommendations(
            String userId, String weather, String timeOfDay, String event, String location) {
        
        Map<String, List<RecommendationResult>> response = new LinkedHashMap<>();

        // Fetch user profile or initialize cold start
        UserTasteProfile profile = null;
        if (userId != null && !userId.trim().isEmpty()) {
            profile = tasteProfileRepository.findByUserId(userId)
                    .orElseGet(() -> createDefaultProfile(userId));
        }

        // Fetch all candidates (normally indexed in Elasticsearch/Redis, we fetch from Mongo)
        List<Restaurant> restaurants = restaurantRepository.findAll();
        List<MenuItem> menuItems = menuItemRepository.findAll();

        // Determine A/B test strategy for this user
        String strategy = (userId != null && userId.hashCode() % 2 == 0) ? "STRATEGY_A" : "STRATEGY_B";

        // 1. Recommended For You (Personalized Collaborative/Content Filtering)
        response.put("recommendedForYou", getPersonalizedRecommendations(profile, restaurants, menuItems, strategy));

        // 2. Trending Near You (Location-based + Quality Score)
        response.put("trendingNearYou", getTrendingNearYou(restaurants, location, strategy));

        // 3. Healthy Choices (Dietary / Health Profile filters)
        response.put("healthyChoices", getHealthyChoices(menuItems, profile, strategy));

        // 4. Time-based Specials (Morning/Afternoon/Evening/Midnight)
        response.put("timeBasedSpecials", getTimeBasedSpecials(menuItems, timeOfDay, strategy));

        // 5. Contextual Weather Specials (Rainy/Cold/Summer)
        response.put("weatherSpecials", getWeatherSpecials(menuItems, weather, strategy));

        // 6. Chef Recommendations / Admin Promoted Campaigns
        response.put("chefRecommendations", getPromotedRecommendations(restaurants, menuItems, strategy));

        // 7. Recently/Frequently Ordered
        response.put("frequentlyOrdered", getFrequentlyOrdered(profile, menuItems, strategy));

        return response;
    }

    private UserTasteProfile createDefaultProfile(String userId) {
        UserTasteProfile newProfile = UserTasteProfile.builder()
                .userId(userId)
                .preferredCuisines(new ArrayList<>())
                .preferredCategories(new ArrayList<>())
                .dietaryPreferences(new ArrayList<>())
                .frequentItems(new HashMap<>())
                .frequentRestaurants(new HashMap<>())
                .budgetTier("MEDIUM")
                .lastUpdated(LocalDateTime.now())
                .build();
        return tasteProfileRepository.save(newProfile);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. SCORING & FILTERING ALGORITHMS
    // ────────────────────────────────────────────────────────────────────────

    private List<RecommendationResult> getPersonalizedRecommendations(
            UserTasteProfile profile, List<Restaurant> restaurants, List<MenuItem> menuItems, String strategy) {
        
        List<RecommendationResult> results = new ArrayList<>();
        
        // Cold Start Fallback
        if (profile == null || (profile.getPreferredCuisines().isEmpty() && profile.getFrequentRestaurants().isEmpty())) {
            // Suggest top rated restaurants
            List<Restaurant> topRated = restaurants.stream()
                    .filter(Restaurant::isOpen)
                    .sorted((r1, r2) -> Double.compare(r2.getRating() != null ? r2.getRating() : 0.0, r1.getRating() != null ? r1.getRating() : 0.0))
                    .limit(5)
                    .collect(Collectors.toList());

            for (Restaurant r : topRated) {
                results.add(RecommendationResult.builder()
                        .type("RESTAURANT")
                        .data(r)
                        .reason("Popular choice in your city")
                        .strategy(strategy)
                        .build());
            }
            return results;
        }

        // Personalized Scoring
        // Score restaurants based on cuisine match and user history
        List<Restaurant> scoredRestaurants = restaurants.stream()
                .filter(Restaurant::isOpen)
                .sorted((r1, r2) -> {
                    double s1 = calculateRestaurantScore(r1, profile);
                    double s2 = calculateRestaurantScore(r2, profile);
                    return Double.compare(s2, s1);
                })
                .limit(5)
                .collect(Collectors.toList());

        for (Restaurant r : scoredRestaurants) {
            String reason = "Matches your favorite cuisine: " + r.getCuisineType();
            if (profile.getFrequentRestaurants().containsKey(r.getId())) {
                reason = "Based on your repeat visits";
            }
            results.add(RecommendationResult.builder()
                    .type("RESTAURANT")
                    .data(r)
                    .reason(reason)
                    .strategy(strategy)
                    .build());
        }

        return results;
    }

    private double calculateRestaurantScore(Restaurant r, UserTasteProfile profile) {
        double score = 0.0;
        if (r.getRating() != null) score += r.getRating() * 2.0; // rating weight

        // Cuisine match weight
        if (profile.getPreferredCuisines().contains(r.getCuisineType())) {
            score += 5.0;
        }

        // Prior ordering history match weight
        if (profile.getFrequentRestaurants().containsKey(r.getId())) {
            score += 10.0 + profile.getFrequentRestaurants().get(r.getId());
        }

        return score;
    }

    private List<RecommendationResult> getTrendingNearYou(List<Restaurant> restaurants, String location, String strategy) {
        // Filter by location/city, sort by rating and fast delivery
        List<Restaurant> sorted = restaurants.stream()
                .filter(r -> location == null || r.getCity() == null || r.getCity().equalsIgnoreCase(location))
                .sorted((r1, r2) -> {
                    double rate1 = r1.getRating() != null ? r1.getRating() : 0.0;
                    double rate2 = r2.getRating() != null ? r2.getRating() : 0.0;
                    return Double.compare(rate2, rate1);
                })
                .limit(5)
                .collect(Collectors.toList());

        List<RecommendationResult> results = new ArrayList<>();
        for (Restaurant r : sorted) {
            results.add(RecommendationResult.builder()
                    .type("RESTAURANT")
                    .data(r)
                    .reason("Trending high demand in your area")
                    .strategy(strategy)
                    .build());
        }
        return results;
    }

    private List<RecommendationResult> getHealthyChoices(List<MenuItem> items, UserTasteProfile profile, String strategy) {
        // Vegetarian or Vegan filters
        List<MenuItem> healthy = items.stream()
                .filter(MenuItem::isAvailable)
                .filter(item -> {
                    if (profile != null && !profile.getDietaryPreferences().isEmpty()) {
                        // User specific health profile
                        return profile.getDietaryPreferences().stream().anyMatch(pref -> {
                            if ("VEGETARIAN".equalsIgnoreCase(pref)) return item.isVegetarian();
                            return item.getDescription() != null && item.getDescription().toLowerCase().contains(pref.toLowerCase());
                        });
                    }
                    // default filter
                    return item.isVegetarian() || (item.getDescription() != null && item.getDescription().toLowerCase().contains("healthy"));
                })
                .limit(5)
                .collect(Collectors.toList());

        List<RecommendationResult> results = new ArrayList<>();
        for (MenuItem item : healthy) {
            results.add(RecommendationResult.builder()
                    .type("MENU_ITEM")
                    .data(item)
                    .reason("Matches your healthy diet preference")
                    .strategy(strategy)
                    .build());
        }
        return results;
    }

    private List<RecommendationResult> getTimeBasedSpecials(List<MenuItem> items, String timeOfDay, String strategy) {
        String finalTime = (timeOfDay == null) ? getAutomaticTimeOfDay() : timeOfDay;
        List<MenuItem> filtered = items.stream()
                .filter(MenuItem::isAvailable)
                .filter(item -> matchesTimeCategory(item, finalTime))
                .limit(5)
                .collect(Collectors.toList());

        List<RecommendationResult> results = new ArrayList<>();
        for (MenuItem item : filtered) {
            results.add(RecommendationResult.builder()
                    .type("MENU_ITEM")
                    .data(item)
                    .reason("Perfect pick for your " + finalTime.toLowerCase())
                    .strategy(strategy)
                    .build());
        }
        return results;
    }

    private List<RecommendationResult> getWeatherSpecials(List<MenuItem> items, String weather, String strategy) {
        String finalWeather = (weather == null) ? "RAINY" : weather.toUpperCase(); // Fallback simulation
        List<MenuItem> filtered = items.stream()
                .filter(MenuItem::isAvailable)
                .filter(item -> matchesWeatherCategory(item, finalWeather))
                .limit(5)
                .collect(Collectors.toList());

        List<RecommendationResult> results = new ArrayList<>();
        for (MenuItem item : filtered) {
            results.add(RecommendationResult.builder()
                    .type("MENU_ITEM")
                    .data(item)
                    .reason("Warm comfort food for a " + finalWeather.toLowerCase() + " day")
                    .strategy(strategy)
                    .build());
        }
        return results;
    }

    private List<RecommendationResult> getPromotedRecommendations(List<Restaurant> restaurants, List<MenuItem> menuItems, String strategy) {
        List<RecommendationCampaign> campaigns = campaignRepository.findByActive(true);
        List<RecommendationResult> results = new ArrayList<>();

        for (RecommendationCampaign c : campaigns) {
            if ("BOOST_RESTAURANT".equals(c.getType())) {
                restaurants.stream()
                        .filter(r -> r.getId().equals(c.getTargetId()))
                        .findFirst()
                        .ifPresent(r -> results.add(RecommendationResult.builder()
                                .type("RESTAURANT")
                                .data(r)
                                .reason("Chef's Featured Recommendation")
                                .strategy(strategy)
                                .build()));
            } else if ("BOOST_FOOD".equals(c.getType())) {
                menuItems.stream()
                        .filter(item -> item.getName().equalsIgnoreCase(c.getTargetId()))
                        .findFirst()
                        .ifPresent(item -> results.add(RecommendationResult.builder()
                                .type("MENU_ITEM")
                                .data(item)
                                .reason("Recommended Special promotion")
                                .strategy(strategy)
                                .build()));
            }
        }
        return results;
    }

    private List<RecommendationResult> getFrequentlyOrdered(UserTasteProfile profile, List<MenuItem> items, String strategy) {
        List<RecommendationResult> results = new ArrayList<>();
        if (profile == null || profile.getFrequentItems().isEmpty()) {
            return results;
        }

        profile.getFrequentItems().entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(5)
                .forEach(entry -> {
                    items.stream()
                            .filter(item -> item.getId().equals(entry.getKey()))
                            .findFirst()
                            .ifPresent(item -> results.add(RecommendationResult.builder()
                                    .type("MENU_ITEM")
                                    .data(item)
                                    .reason("Frequently ordered by you")
                                    .strategy(strategy)
                                    .build()));
                });

        return results;
    }

    private String getAutomaticTimeOfDay() {
        int hour = java.time.LocalTime.now().getHour();
        if (hour >= 6 && hour < 11) return "MORNING";
        if (hour >= 11 && hour < 16) return "AFTERNOON";
        if (hour >= 16 && hour < 22) return "EVENING";
        return "MIDNIGHT";
    }

    private boolean matchesTimeCategory(MenuItem item, String timeOfDay) {
        String category = item.getCategory() != null ? item.getCategory().toLowerCase() : "";
        String name = item.getName() != null ? item.getName().toLowerCase() : "";
        
        if ("MORNING".equalsIgnoreCase(timeOfDay)) {
            return category.contains("breakfast") || name.contains("breakfast") || name.contains("coffee") || name.contains("tea") || name.contains("juice");
        }
        if ("AFTERNOON".equalsIgnoreCase(timeOfDay)) {
            return category.contains("lunch") || category.contains("thali") || category.contains("meals") || category.contains("biryani");
        }
        if ("MIDNIGHT".equalsIgnoreCase(timeOfDay)) {
            return category.contains("burger") || category.contains("pizza") || category.contains("dessert") || name.contains("ice cream") || name.contains("fries");
        }
        // Evening / general
        return true;
    }

    private boolean matchesWeatherCategory(MenuItem item, String weather) {
        String name = item.getName() != null ? item.getName().toLowerCase() : "";
        String desc = item.getDescription() != null ? item.getDescription().toLowerCase() : "";
        
        if ("RAINY".equalsIgnoreCase(weather) || "COLD".equalsIgnoreCase(weather)) {
            return name.contains("tea") || name.contains("coffee") || name.contains("soup") || name.contains("pakora") || name.contains("hot") || desc.contains("comfort");
        }
        if ("SUMMER".equalsIgnoreCase(weather)) {
            return name.contains("juice") || name.contains("ice cream") || name.contains("shake") || name.contains("cold") || name.contains("lassi");
        }
        return true;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. AUTO COMBO GENERATOR (FREQUENTLY BOUGHT TOGETHER)
    // ────────────────────────────────────────────────────────────────────────
    public List<SmartCombo> getFrequentlyBoughtTogether(List<String> cartItemIds) {
        List<SmartCombo> combos = new ArrayList<>();
        List<MenuItem> allItems = menuItemRepository.findAll();

        if (cartItemIds == null || cartItemIds.isEmpty()) {
            // Default combos
            combos.add(createMockCombo("Royal Burger Feast", List.of("Burger", "Fries", "Coke"), allItems, "Tasty burger with crisp fries and soda"));
            combos.add(createMockCombo("Pan Pizza Party Pack", List.of("Pizza", "Garlic Bread", "Pepsi"), allItems, "Family pizza meal with side side bites"));
            return combos;
        }

        // Generate dynamic matching combos based on cart items
        for (String id : cartItemIds) {
            Optional<MenuItem> target = allItems.stream().filter(i -> i.getId().equals(id)).findFirst();
            if (target.isPresent()) {
                MenuItem item = target.get();
                if (item.getCategory() != null && item.getCategory().toLowerCase().contains("burger")) {
                    combos.add(createMockCombo("Burger Upgrade Pack", List.of(item.getName(), "Fries", "Coke"), allItems, "Make it a meal with fries & coke"));
                } else if (item.getCategory() != null && item.getCategory().toLowerCase().contains("pizza")) {
                    combos.add(createMockCombo("Pizza Meal Upgrade", List.of(item.getName(), "Garlic Bread", "Pepsi"), allItems, "Add dynamic cheese garlic bread & Pepsi"));
                } else if (item.getCategory() != null && item.getCategory().toLowerCase().contains("biryani")) {
                    combos.add(createMockCombo("Classic Biryani Combo", List.of(item.getName(), "Raita", "Cold Drink"), allItems, "Standard complete Biryani meal package"));
                }
            }
        }

        return combos;
    }

    private SmartCombo createMockCombo(String comboName, List<String> itemNames, List<MenuItem> allItems, String description) {
        List<MenuItem> comboItems = new ArrayList<>();
        double originalPrice = 0.0;

        for (String name : itemNames) {
            Optional<MenuItem> matched = allItems.stream()
                    .filter(i -> i.getName().toLowerCase().contains(name.toLowerCase()))
                    .findFirst();
            if (matched.isPresent()) {
                comboItems.add(matched.get());
                originalPrice += matched.get().getPrice();
            } else {
                // mock item if it does not exist in DB
                MenuItem mock = MenuItem.builder()
                        .id("mock_" + name.toLowerCase())
                        .name(name)
                        .price(name.equalsIgnoreCase("Coke") || name.equalsIgnoreCase("Pepsi") || name.equalsIgnoreCase("Cold Drink") ? 40.0 : 90.0)
                        .category("Drinks/Sides")
                        .available(true)
                        .build();
                comboItems.add(mock);
                originalPrice += mock.getPrice();
            }
        }

        double discountedPrice = Math.round((originalPrice * 0.85) * 10.0) / 10.0; // 15% discount combo

        return SmartCombo.builder()
                .name(comboName)
                .items(comboItems)
                .originalPrice(originalPrice)
                .comboPrice(discountedPrice)
                .description(description)
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. REAL-TIME USER ACTIONS TASTE UPDATER
    // ────────────────────────────────────────────────────────────────────────
    public void trackUserInteraction(String userId, String itemId, String action) {
        // Record telemetry log
        String strategy = (userId != null && userId.hashCode() % 2 == 0) ? "STRATEGY_A" : "STRATEGY_B";
        RecommendationMetric metric = RecommendationMetric.builder()
                .strategy(strategy)
                .userId(userId)
                .itemId(itemId)
                .action(action.toUpperCase())
                .timestamp(LocalDateTime.now())
                .build();
        metricRepository.save(metric);

        // Update Taste Profile if user exists and action is conversion/order or click
        if (userId != null && ("CLICK".equalsIgnoreCase(action) || "CONVERSION".equalsIgnoreCase(action) || "ORDER".equalsIgnoreCase(action))) {
            Optional<MenuItem> itemOpt = menuItemRepository.findById(itemId);
            if (itemOpt.isPresent()) {
                MenuItem item = itemOpt.get();
                UserTasteProfile profile = tasteProfileRepository.findByUserId(userId)
                        .orElseGet(() -> createDefaultProfile(userId));

                // Increment item frequency
                profile.getFrequentItems().put(itemId, profile.getFrequentItems().getOrDefault(itemId, 0) + 1);

                // Increment restaurant frequency
                if (item.getRestaurantId() != null) {
                    profile.getFrequentRestaurants().put(item.getRestaurantId(), 
                            profile.getFrequentRestaurants().getOrDefault(item.getRestaurantId(), 0) + 1);
                }

                // Cuisine match update
                Optional<Restaurant> restOpt = restaurantRepository.findById(item.getRestaurantId());
                if (restOpt.isPresent() && restOpt.get().getCuisineType() != null) {
                    String cuisine = restOpt.get().getCuisineType();
                    if (!profile.getPreferredCuisines().contains(cuisine)) {
                        profile.getPreferredCuisines().add(cuisine);
                    }
                }

                // Category match update
                if (item.getCategory() != null && !profile.getPreferredCategories().contains(item.getCategory())) {
                    profile.getPreferredCategories().add(item.getCategory());
                }

                // Set Vegetarian preference automatically if ordering exclusively vegetarian
                if (item.isVegetarian()) {
                    if (!profile.getDietaryPreferences().contains("VEGETARIAN")) {
                        profile.getDietaryPreferences().add("VEGETARIAN");
                    }
                }

                profile.setLastUpdated(LocalDateTime.now());
                tasteProfileRepository.save(profile);
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. A/B TEST METRICS & ANALYTICS REPORT
    // ────────────────────────────────────────────────────────────────────────
    public Map<String, Object> getRecommendationAnalytics() {
        long impressionsA = metricRepository.countByStrategyAndAction("STRATEGY_A", "IMPRESSION");
        long clicksA = metricRepository.countByStrategyAndAction("STRATEGY_A", "CLICK");
        long convA = metricRepository.countByStrategyAndAction("STRATEGY_A", "CONVERSION");

        long impressionsB = metricRepository.countByStrategyAndAction("STRATEGY_B", "IMPRESSION");
        long clicksB = metricRepository.countByStrategyAndAction("STRATEGY_B", "CLICK");
        long convB = metricRepository.countByStrategyAndAction("STRATEGY_B", "CONVERSION");

        double ctrA = impressionsA > 0 ? (clicksA * 100.0 / impressionsA) : 0.0;
        double ctrB = impressionsB > 0 ? (clicksB * 100.0 / impressionsB) : 0.0;

        double convRateA = clicksA > 0 ? (convA * 100.0 / clicksA) : 0.0;
        double convRateB = clicksB > 0 ? (convB * 100.0 / clicksB) : 0.0;

        Map<String, Object> report = new LinkedHashMap<>();
        
        Map<String, Object> statsA = new HashMap<>();
        statsA.put("impressions", impressionsA);
        statsA.put("clicks", clicksA);
        statsA.put("conversions", convA);
        statsA.put("ctr", String.format("%.2f%%", ctrA));
        statsA.put("conversionRate", String.format("%.2f%%", convRateA));

        Map<String, Object> statsB = new HashMap<>();
        statsB.put("impressions", impressionsB);
        statsB.put("clicks", clicksB);
        statsB.put("conversions", convB);
        statsB.put("ctr", String.format("%.2f%%", ctrB));
        statsB.put("conversionRate", String.format("%.2f%%", convRateB));

        report.put("strategyA", statsA);
        report.put("strategyB", statsB);
        report.put("bestStrategy", ctrA > ctrB ? "STRATEGY_A (Collaborative Filtering)" : "STRATEGY_B (Context-Aware Hybrid)");
        report.put("totalInteractionsLogged", metricRepository.count());

        return report;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. ADMIN PROMOTION CAMPAIGNS
    // ────────────────────────────────────────────────────────────────────────
    public RecommendationCampaign createCampaign(RecommendationCampaign campaign) {
        campaign.setActive(true);
        return campaignRepository.save(campaign);
    }

    public RecommendationCampaign toggleCampaign(String id, boolean active) {
        RecommendationCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        campaign.setActive(active);
        return campaignRepository.save(campaign);
    }
}
