package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TasteIntelligenceService {

    private final UserTasteProfileRepository tasteProfileRepository;
    private final UserPreferenceOverrideRepository preferenceOverrideRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final RecommendationFeedbackRepository feedbackRepository;
    private final RecommendationRequestRepository requestRepository;
    private final RecommendationResultRepository resultRepository;
    private final RestaurantDigitalTwinStateRepository digitalTwinStateRepository;
    private final UserTasteHistoryRepository tasteHistoryRepository;

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TasteRecommendationDto {
        private String id; // itemId or restaurantId
        private String type; // "RESTAURANT" or "DISH"
        private Object data; // MenuItem or Restaurant entity
        private double score;
        private List<String> reasonCodes;
        private String explanation;
        private boolean ingredientInfoIncomplete; // True if customer has allergies and item ingredients cannot be fully verified
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TastePreferencesDto {
        private List<String> preferredCuisines;
        private List<String> dislikedCuisines;
        private List<String> favoriteIngredients;
        private List<String> avoidedIngredients;
        private String spicePreference; // LOW, MEDIUM, HIGH
        private String sweetnessPreference; // LOW, MEDIUM, HIGH
        private List<String> dietaryPreferences; // VEGETARIAN, VEGAN, GLUTEN_FREE, etc.
        private Double budgetLimit;
        private List<String> allergies;
        private String discoveryMode; // FAMILIAR, BALANCED, EXPLORER
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ParsedIntentDto {
        private List<String> cuisines;
        private List<String> dishes;
        private Double budgetMax;
        private String spiceLevel;
        private String mealStyle; // LIGHT, HEAVY
        private List<String> excludedIngredients;
        private boolean vegetarian;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. EXPLICIT PREFERENCE MANAGEMENT
    // ────────────────────────────────────────────────────────────────────────

    public TastePreferencesDto getPreferences(Long userId) {
        log.info("Fetching explicit preferences for userId={}", userId);
        List<UserPreferenceOverride> overrides = preferenceOverrideRepository.findByUserId(userId);
        
        List<String> preferredCuisines = new ArrayList<>();
        List<String> dislikedCuisines = new ArrayList<>();
        List<String> favoriteIngredients = new ArrayList<>();
        List<String> avoidedIngredients = new ArrayList<>();
        String spicePreference = "MEDIUM";
        String sweetnessPreference = "MEDIUM";
        List<String> dietaryPreferences = new ArrayList<>();
        Double budgetLimit = null;
        List<String> allergies = new ArrayList<>();
        String discoveryMode = "BALANCED";

        for (UserPreferenceOverride o : overrides) {
            String val = o.getPreferenceValue();
            if (val == null || val.isBlank()) continue;

            switch (o.getPreferenceKey()) {
                case "FAVORITE_CUISINES":
                    preferredCuisines.addAll(Arrays.asList(val.split(",")));
                    break;
                case "DISLIKED_CUISINES":
                    dislikedCuisines.addAll(Arrays.asList(val.split(",")));
                    break;
                case "FAVORITE_INGREDIENTS":
                    favoriteIngredients.addAll(Arrays.asList(val.split(",")));
                    break;
                case "EXCLUDED_INGREDIENT":
                    avoidedIngredients.addAll(Arrays.asList(val.split(",")));
                    break;
                case "SPICE_LEVEL":
                    spicePreference = val;
                    break;
                case "SWEETNESS":
                    sweetnessPreference = val;
                    break;
                case "DIETARY_PREF":
                    dietaryPreferences.addAll(Arrays.asList(val.split(",")));
                    break;
                case "BUDGET_LIMIT":
                    try {
                        budgetLimit = Double.parseDouble(val);
                    } catch (NumberFormatException ignored) {}
                    break;
                case "ALLERGIES":
                    allergies.addAll(Arrays.asList(val.split(",")));
                    break;
                case "DISCOVERY_MODE":
                    discoveryMode = val;
                    break;
            }
        }

        return TastePreferencesDto.builder()
                .preferredCuisines(preferredCuisines.stream().map(String::trim).collect(Collectors.toList()))
                .dislikedCuisines(dislikedCuisines.stream().map(String::trim).collect(Collectors.toList()))
                .favoriteIngredients(favoriteIngredients.stream().map(String::trim).collect(Collectors.toList()))
                .avoidedIngredients(avoidedIngredients.stream().map(String::trim).collect(Collectors.toList()))
                .spicePreference(spicePreference)
                .sweetnessPreference(sweetnessPreference)
                .dietaryPreferences(dietaryPreferences.stream().map(String::trim).collect(Collectors.toList()))
                .budgetLimit(budgetLimit)
                .allergies(allergies.stream().map(String::trim).collect(Collectors.toList()))
                .discoveryMode(discoveryMode)
                .build();
    }

    @Transactional
    public void savePreferences(Long userId, TastePreferencesDto dto) {
        log.info("Saving explicit taste preferences for userId={}", userId);
        preferenceOverrideRepository.deleteByUserId(userId);

        saveSingleOverride(userId, "FAVORITE_CUISINES", String.join(",", dto.getPreferredCuisines()));
        saveSingleOverride(userId, "DISLIKED_CUISINES", String.join(",", dto.getDislikedCuisines()));
        saveSingleOverride(userId, "FAVORITE_INGREDIENTS", String.join(",", dto.getFavoriteIngredients()));
        saveSingleOverride(userId, "EXCLUDED_INGREDIENT", String.join(",", dto.getAvoidedIngredients()));
        saveSingleOverride(userId, "SPICE_LEVEL", dto.getSpicePreference());
        saveSingleOverride(userId, "SWEETNESS", dto.getSweetnessPreference());
        saveSingleOverride(userId, "DIETARY_PREF", String.join(",", dto.getDietaryPreferences()));
        if (dto.getBudgetLimit() != null) {
            saveSingleOverride(userId, "BUDGET_LIMIT", String.valueOf(dto.getBudgetLimit()));
        }
        saveSingleOverride(userId, "ALLERGIES", String.join(",", dto.getAllergies()));
        saveSingleOverride(userId, "DISCOVERY_MODE", dto.getDiscoveryMode());

        // Update UserTasteProfile to reflect new preferences overrides
        UserTasteProfile profile = tasteProfileRepository.findByUserId(String.valueOf(userId))
                .orElseGet(() -> UserTasteProfile.builder()
                        .userId(String.valueOf(userId))
                        .lastUpdated(LocalDateTime.now())
                        .build());

        profile.setPreferredCuisines(dto.getPreferredCuisines());
        profile.setDietaryPreferences(dto.getDietaryPreferences());
        if (dto.getBudgetLimit() != null) {
            profile.setMaxPrice(dto.getBudgetLimit());
            if (dto.getBudgetLimit() <= 200.0) {
                profile.setBudgetTier("BUDGET");
            } else if (dto.getBudgetLimit() <= 450.0) {
                profile.setBudgetTier("MEDIUM");
            } else {
                profile.setBudgetTier("PREMIUM");
            }
        }
        profile.setLastUpdated(LocalDateTime.now());
        tasteProfileRepository.save(profile);
    }

    private void saveSingleOverride(Long userId, String key, String val) {
        if (val == null || val.isBlank()) return;
        preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                .userId(userId)
                .preferenceKey(key)
                .preferenceValue(val)
                .createdAt(LocalDateTime.now())
                .build());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. HEALTH & TIME PERIOD CONTEXT HELPERS
    // ────────────────────────────────────────────────────────────────────────

    public String getMealPeriod() {
        int hour = LocalTime.now().getHour();
        if (hour >= 5 && hour < 10) return "BREAKFAST";
        if (hour >= 10 && hour < 12) return "BRUNCH";
        if (hour >= 12 && hour < 15) return "LUNCH";
        if (hour >= 15 && hour < 18) return "SNACK";
        if (hour >= 18 && hour < 22) return "DINNER";
        return "LATE_NIGHT";
    }

    private boolean isRestaurantOpen(Restaurant r) {
        if (r == null) return false;
        if (!r.isOpen()) return false;
        
        // Query the real-time Digital Twin state
        Optional<RestaurantDigitalTwinState> twinState = digitalTwinStateRepository.findByRestaurantId(r.getId());
        if (twinState.isPresent()) {
            return !"CLOSED".equalsIgnoreCase(twinState.get().getStatus());
        }
        return true;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. CORE RECOMMENDATION PIPELINE (CANDIDATES -> FILTERS -> RANKING -> DIVERSITY)
    // ────────────────────────────────────────────────────────────────────────

    public List<TasteRecommendationDto> getRecommendations(Long userId, String weather, String timeOfDay, String location, Double customBudget) {
        String requestId = UUID.randomUUID().toString();
        log.info("Generating personalized recommendations request_id={} userId={} weather={}", requestId, userId, weather);

        // Fetch candidate lists from Mongo
        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        List<MenuItem> allMenuItems = menuItemRepository.findAll();

        // 1. Get explicit preferences (and overrides)
        TastePreferencesDto prefs = (userId != null) ? getPreferences(userId) : TastePreferencesDto.builder()
                .preferredCuisines(new ArrayList<>())
                .dislikedCuisines(new ArrayList<>())
                .favoriteIngredients(new ArrayList<>())
                .avoidedIngredients(new ArrayList<>())
                .spicePreference("MEDIUM")
                .sweetnessPreference("MEDIUM")
                .dietaryPreferences(new ArrayList<>())
                .allergies(new ArrayList<>())
                .discoveryMode("BALANCED")
                .build();

        // Fetch user history taste profile (weak behavioral inference)
        UserTasteProfile profile = (userId != null) ? tasteProfileRepository.findByUserId(String.valueOf(userId)).orElse(null) : null;

        // Apply custom budget limit override if provided
        Double finalBudget = customBudget != null ? customBudget : prefs.getBudgetLimit();

        // Save recommendation request to trace
        if (userId != null) {
            requestRepository.save(RecommendationRequest.builder()
                    .requestId(requestId)
                    .userId(userId)
                    .contextWeather(weather)
                    .contextTimeOfDay(timeOfDay != null ? timeOfDay : getMealPeriod())
                    .contextLocation(location)
                    .contextBudget(finalBudget)
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        // Map restaurant availability
        Map<String, Restaurant> restaurantMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // 2. Apply Hard Filters
        List<MenuItem> filteredItems = allMenuItems.stream()
                .filter(item -> {
                    // Check item availability
                    if (!item.isAvailable()) return false;

                    // Fetch restaurant
                    Restaurant r = restaurantMap.get(item.getRestaurantId());
                    if (r == null) return false;

                    // Closed restaurant check (including digital twin state)
                    if (!isRestaurantOpen(r)) return false;

                    // Out of delivery area check
                    if (location != null && r.getCity() != null && !r.getCity().equalsIgnoreCase(location)) return false;

                    // Budget filter
                    if (finalBudget != null && item.getPrice() > finalBudget) return false;

                    // Dietary filters (overrides)
                    if (prefs.getDietaryPreferences().contains("VEGETARIAN") && !item.isVegetarian()) return false;

                    // Disliked cuisines check
                    if (r.getCuisineType() != null && prefs.getDislikedCuisines().contains(r.getCuisineType())) return false;

                    // Excluded ingredients / allergies hard check
                    String itemText = (item.getName() + " " + item.getDescription()).toLowerCase();
                    for (String allergen : prefs.getAllergies()) {
                        if (itemText.contains(allergen.toLowerCase())) return false;
                    }
                    for (String excluded : prefs.getAvoidedIngredients()) {
                        if (itemText.contains(excluded.toLowerCase())) return false;
                    }

                    return true;
                })
                .collect(Collectors.toList());

        // 3. Multi-Stage Scoring and Contextual Ranking
        List<TasteRecommendationDto> scoredCandidates = new ArrayList<>();
        for (MenuItem item : filteredItems) {
            Restaurant r = restaurantMap.get(item.getRestaurantId());
            double score = 50.0; // Base score
            List<String> reasonCodes = new ArrayList<>();
            List<String> reasons = new ArrayList<>();

            // 3.1. Cuisine Match
            if (prefs.getPreferredCuisines().contains(r.getCuisineType())) {
                score += 25.0;
                reasonCodes.add("CUISINE_MATCH");
                reasons.add("Matches preferred " + r.getCuisineType() + " cuisine");
            } else if (profile != null && profile.getPreferredCuisines().contains(r.getCuisineType())) {
                score += 15.0;
                reasonCodes.add("CUISINE_BEHAVIORAL");
                reasons.add("Matches cuisine you ordered recently");
            }

            // 3.2. Order History (repeat visitor boost)
            if (profile != null) {
                if (profile.getFrequentItems().containsKey(item.getId())) {
                    int count = profile.getFrequentItems().get(item.getId());
                    score += Math.min(20.0, count * 2.0);
                    reasonCodes.add("FREQUENT_ITEM");
                    reasons.add("You've ordered this dish " + count + " times");
                }
                if (profile.getFrequentRestaurants().containsKey(r.getId())) {
                    int count = profile.getFrequentRestaurants().get(r.getId());
                    score += Math.min(10.0, count * 1.0);
                    reasonCodes.add("FREQUENT_RESTAURANT");
                }
            }

            // 3.3. Meal period match (Time contextual)
            String currentMeal = timeOfDay != null ? timeOfDay : getMealPeriod();
            boolean isMealMatch = matchesMealContext(item, currentMeal);
            if (isMealMatch) {
                score += 15.0;
                reasonCodes.add("TIME_MATCH");
                reasons.add("Perfect choice for " + currentMeal.toLowerCase());
            }

            // 3.4. Weather context match
            if (weather != null && matchesWeatherContext(item, weather)) {
                score += 10.0;
                reasonCodes.add("WEATHER_MATCH");
                reasons.add("Great option for a " + weather.toLowerCase() + " day");
            }

            // 3.5. Spice & Sweetness preferences
            String itemText = (item.getName() + " " + item.getDescription()).toLowerCase();
            if ("HIGH".equalsIgnoreCase(prefs.getSpicePreference()) && (itemText.contains("spicy") || itemText.contains("chili") || itemText.contains("hot"))) {
                score += 10.0;
                reasonCodes.add("SPICE_MATCH");
            } else if ("LOW".equalsIgnoreCase(prefs.getSpicePreference()) && (itemText.contains("spicy") || itemText.contains("chili") || itemText.contains("hot"))) {
                score -= 15.0; // penalty
            }

            if ("HIGH".equalsIgnoreCase(prefs.getSweetnessPreference()) && (itemText.contains("sweet") || itemText.contains("dessert") || itemText.contains("chocolate"))) {
                score += 10.0;
                reasonCodes.add("SWEETNESS_MATCH");
            }

            // 3.6. Restaurant Rating
            if (r.getRating() != null) {
                score += (r.getRating() * 2.0); // Up to 10 points
                if (r.getRating() >= 4.5) {
                    reasons.add("Highly rated (" + r.getRating() + " ⭐)");
                }
            }

            // Incomplete allergies label
            boolean allergyWarning = !prefs.getAllergies().isEmpty();

            String explanation = reasons.isEmpty() ? "Recommended for you" : String.join(", ", reasons);

            scoredCandidates.add(TasteRecommendationDto.builder()
                    .id(item.getId())
                    .type("DISH")
                    .data(item)
                    .score(score)
                    .reasonCodes(reasonCodes)
                    .explanation(explanation)
                    .ingredientInfoIncomplete(allergyWarning)
                    .build());
        }

        // Sort candidates
        scoredCandidates.sort((a, b) -> Double.compare(b.getScore(), a.score));

        // 4. Discovery Mode selection (Familiar, Balanced, Explorer)
        String mode = prefs.getDiscoveryMode();
        List<TasteRecommendationDto> finalSelection = new ArrayList<>();
        
        double familiarRatio = 0.5;
        double explorerRatio = 0.5;
        if ("FAMILIAR".equalsIgnoreCase(mode)) {
            familiarRatio = 0.8;
            explorerRatio = 0.2;
        } else if ("EXPLORER".equalsIgnoreCase(mode)) {
            familiarRatio = 0.2;
            explorerRatio = 0.8;
        } // BALANCED is 0.5/0.5

        // Partition candidates by Familiar (ordered before/liked) vs Explorer (never ordered before)
        List<TasteRecommendationDto> familiarPool = new ArrayList<>();
        List<TasteRecommendationDto> explorerPool = new ArrayList<>();

        for (TasteRecommendationDto cand : scoredCandidates) {
            MenuItem mi = (MenuItem) cand.getData();
            boolean isFamiliar = (profile != null && (profile.getFrequentItems().containsKey(mi.getId()) || profile.getFrequentRestaurants().containsKey(mi.getRestaurantId())));
            if (isFamiliar) {
                familiarPool.add(cand);
            } else {
                explorerPool.add(cand);
            }
        }

        int targetSize = Math.min(12, scoredCandidates.size());
        int targetFamiliar = (int) Math.round(targetSize * familiarRatio);
        int targetExplorer = targetSize - targetFamiliar;

        List<TasteRecommendationDto> chosenFamiliar = familiarPool.stream().limit(targetFamiliar).collect(Collectors.toList());
        List<TasteRecommendationDto> chosenExplorer = explorerPool.stream().limit(targetExplorer).collect(Collectors.toList());

        finalSelection.addAll(chosenFamiliar);
        finalSelection.addAll(chosenExplorer);

        // Sort choices by final score again
        finalSelection.sort((a, b) -> Double.compare(b.getScore(), a.score));

        // 5. Diversity Re-ranking (avoid dominating restaurants/cuisines)
        List<TasteRecommendationDto> diversified = new ArrayList<>();
        Map<String, Integer> restaurantCounts = new HashMap<>();
        Map<String, Integer> categoryCounts = new HashMap<>();

        for (TasteRecommendationDto cand : finalSelection) {
            MenuItem mi = (MenuItem) cand.getData();
            Restaurant rest = restaurantMap.get(mi.getRestaurantId());
            String restId = rest.getId();
            String cat = mi.getCategory();

            int rCount = restaurantCounts.getOrDefault(restId, 0);
            int cCount = categoryCounts.getOrDefault(cat, 0);

            // Diversity constraints: max 2 from same restaurant, max 3 from same category
            if (rCount < 2 && cCount < 3) {
                diversified.add(cand);
                restaurantCounts.put(restId, rCount + 1);
                categoryCounts.put(cat, cCount + 1);
            }
        }

        // Save result impressions to traces
        if (userId != null && !diversified.isEmpty()) {
            int rank = 1;
            for (TasteRecommendationDto res : diversified) {
                resultRepository.save(RecommendationResult.builder()
                        .requestId(requestId)
                        .itemId(res.getId())
                        .itemType("DISH")
                        .score(res.getScore())
                        .reasonCodes(String.join(",", res.getReasonCodes()))
                        .rankPosition(rank++)
                        .build());
            }
        }

        return diversified;
    }

    private boolean matchesMealContext(MenuItem item, String mealPeriod) {
        String cat = item.getCategory() != null ? item.getCategory().toLowerCase() : "";
        String name = item.getName() != null ? item.getName().toLowerCase() : "";

        switch (mealPeriod) {
            case "BREAKFAST":
                return cat.contains("breakfast") || name.contains("breakfast") || name.contains("coffee") || name.contains("tea") || name.contains("egg") || name.contains("dosa") || name.contains("idli");
            case "BRUNCH":
                return cat.contains("breakfast") || cat.contains("snack") || name.contains("sandwich") || name.contains("paratha");
            case "LUNCH":
                return cat.contains("thali") || cat.contains("meals") || cat.contains("lunch") || cat.contains("biryani") || cat.contains("curry");
            case "SNACK":
                return cat.contains("snack") || cat.contains("beverages") || name.contains("samosa") || name.contains("fries") || name.contains("tea") || name.contains("coffee") || name.contains("maggi");
            case "DINNER":
                return cat.contains("meals") || cat.contains("dinner") || cat.contains("biryani") || cat.contains("roti") || cat.contains("curry");
            case "LATE_NIGHT":
                return cat.contains("burger") || cat.contains("pizza") || cat.contains("dessert") || name.contains("ice cream") || name.contains("waffle") || name.contains("rolls");
        }
        return true;
    }

    private boolean matchesWeatherContext(MenuItem item, String weather) {
        String name = item.getName() != null ? item.getName().toLowerCase() : "";
        String desc = item.getDescription() != null ? item.getDescription().toLowerCase() : "";
        String finalWeather = weather.toUpperCase();

        if (finalWeather.contains("RAINY") || finalWeather.contains("COLD") || finalWeather.contains("WINTER")) {
            return name.contains("soup") || name.contains("tea") || name.contains("coffee") || name.contains("pakora") || name.contains("hot") || desc.contains("comfort") || desc.contains("warm");
        }
        if (finalWeather.contains("SUMMER") || finalWeather.contains("HOT")) {
            return name.contains("juice") || name.contains("shake") || name.contains("ice cream") || name.contains("cold") || name.contains("lassi") || name.contains("mojito");
        }
        return true;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. GET HOME FEED SECTIONS
    // ────────────────────────────────────────────────────────────────────────

    public Map<String, List<TasteRecommendationDto>> getHomeFeed(Long userId, String weather, String timeOfDay, String location) {
        log.info("Generating home feed sections for userId={}", userId);
        Map<String, List<TasteRecommendationDto>> sections = new LinkedHashMap<>();

        // Fetch recommendations from unified pipeline
        List<TasteRecommendationDto> baseRecommendations = getRecommendations(userId, weather, timeOfDay, location, null);

        // Map restaurant mapping
        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        Map<String, Restaurant> restaurantMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // 1. For You (Top personalized candidates)
        sections.put("forYou", baseRecommendations.stream().limit(6).collect(Collectors.toList()));

        // Fetch UserTasteProfile
        UserTasteProfile profile = (userId != null) ? tasteProfileRepository.findByUserId(String.valueOf(userId)).orElse(null) : null;

        // 2. Because You Liked (similar cuisines/categories ordered before)
        List<TasteRecommendationDto> becauseYouLiked = new ArrayList<>();
        if (profile != null && !profile.getPreferredCuisines().isEmpty()) {
            String favCuisine = profile.getPreferredCuisines().get(0);
            becauseYouLiked = baseRecommendations.stream()
                    .filter(c -> {
                        MenuItem mi = (MenuItem) c.getData();
                        Restaurant r = restaurantMap.get(mi.getRestaurantId());
                        return r != null && favCuisine.equalsIgnoreCase(r.getCuisineType());
                    })
                    .limit(6)
                    .collect(Collectors.toList());
        }
        sections.put("becauseYouLiked", becauseYouLiked);

        // 3. Try Something New (Explorer Candidates)
        List<TasteRecommendationDto> explorerChoices = baseRecommendations.stream()
                .filter(c -> {
                    MenuItem mi = (MenuItem) c.getData();
                    boolean familiar = (profile != null && (profile.getFrequentItems().containsKey(mi.getId()) || profile.getFrequentRestaurants().containsKey(mi.getRestaurantId())));
                    return !familiar;
                })
                .limit(6)
                .collect(Collectors.toList());
        sections.put("trySomethingNew", explorerChoices);

        // 4. Popular Near You (Filtered by rating)
        List<TasteRecommendationDto> popularNearYou = baseRecommendations.stream()
                .filter(c -> {
                    MenuItem mi = (MenuItem) c.getData();
                    Restaurant r = restaurantMap.get(mi.getRestaurantId());
                    return r != null && r.getRating() != null && r.getRating() >= 4.0;
                })
                .sorted((a, b) -> {
                    MenuItem miA = (MenuItem) a.getData();
                    MenuItem miB = (MenuItem) b.getData();
                    Restaurant rA = restaurantMap.get(miA.getRestaurantId());
                    Restaurant rB = restaurantMap.get(miB.getRestaurantId());
                    return Double.compare(rB.getRating() != null ? rB.getRating() : 0.0, rA.getRating() != null ? rA.getRating() : 0.0);
                })
                .limit(6)
                .collect(Collectors.toList());
        sections.put("popularNearYou", popularNearYou);

        // 5. Quick Delivery (Avg delivery time < 30 minutes)
        List<TasteRecommendationDto> quickDelivery = baseRecommendations.stream()
                .filter(c -> {
                    MenuItem mi = (MenuItem) c.getData();
                    Restaurant r = restaurantMap.get(mi.getRestaurantId());
                    return r != null && r.getAvgDeliveryTime() != null && r.getAvgDeliveryTime() <= 30;
                })
                .limit(6)
                .collect(Collectors.toList());
        sections.put("quickDelivery", quickDelivery);

        // 6. Under Your Budget (Dishes < ₹250)
        List<TasteRecommendationDto> underBudget = baseRecommendations.stream()
                .filter(c -> {
                    MenuItem mi = (MenuItem) c.getData();
                    return mi.getPrice() <= 250.0;
                })
                .limit(6)
                .collect(Collectors.toList());
        sections.put("underYourBudget", underBudget);

        // 7. Smart Reorders (Frequent items ordered at this period)
        sections.put("reorder", getReorderRecommendations(userId).stream().limit(6).collect(Collectors.toList()));

        // 8. Trending Now (Trending dishes based on sales counts)
        sections.put("trendingNow", getTrendingRecommendations(location).stream().limit(6).collect(Collectors.toList()));

        return sections;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. SMART REORDER ENGINE (Section 25 & 26)
    // ────────────────────────────────────────────────────────────────────────

    public List<TasteRecommendationDto> getReorderRecommendations(Long userId) {
        log.info("Running Smart Reorder Engine for userId={}", userId);
        if (userId == null) return new ArrayList<>();

        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedDateDesc(userId);
        if (orders.isEmpty()) return new ArrayList<>();

        List<MenuItem> allMenuItems = menuItemRepository.findAll();
        Map<String, MenuItem> itemMap = allMenuItems.stream()
                .collect(Collectors.toMap(MenuItem::getId, i -> i, (i1, i2) -> i1));

        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        Map<String, Restaurant> restaurantMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // Aggregate orders by menuItemId
        Map<String, List<LocalDateTime>> orderHistoryTimes = new HashMap<>();
        for (Order o : orders) {
            for (OrderItem oi : o.getOrderItems()) {
                orderHistoryTimes.computeIfAbsent(oi.getMenuItemId(), k -> new ArrayList<>()).add(o.getCreatedDate());
            }
        }

        List<TasteRecommendationDto> reorderList = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DayOfWeek today = now.getDayOfWeek();
        String currentPeriod = getMealPeriod();

        for (Map.Entry<String, List<LocalDateTime>> entry : orderHistoryTimes.entrySet()) {
            String itemId = entry.getKey();
            List<LocalDateTime> dates = entry.getValue();
            MenuItem mi = itemMap.get(itemId);
            if (mi == null || !mi.isAvailable()) continue;

            Restaurant r = restaurantMap.get(mi.getRestaurantId());
            if (r == null || !isRestaurantOpen(r)) continue;

            double score = 50.0;
            String reasonCode = "REORDER_HISTORY";
            String explanation = "You ordered this before";

            // Count occurrences
            int count = dates.size();
            score += Math.min(30.0, count * 5.0);

            // Pattern detection: Friday favorite / weekend favorite
            boolean isDayMatch = false;
            for (LocalDateTime date : dates) {
                if (date.getDayOfWeek() == today) {
                    isDayMatch = true;
                    break;
                }
            }

            if (isDayMatch && count >= 2) {
                score += 25.0;
                reasonCode = "REORDER_PREDICTION";
                explanation = "Your " + today.name().toLowerCase() + " favorite?";
            } else {
                // Period match
                boolean isPeriodMatch = false;
                for (LocalDateTime date : dates) {
                    int hr = date.getHour();
                    String per = "LUNCH";
                    if (hr >= 5 && hr < 10) per = "BREAKFAST";
                    else if (hr >= 10 && hr < 12) per = "BRUNCH";
                    else if (hr >= 12 && hr < 15) per = "LUNCH";
                    else if (hr >= 15 && hr < 18) per = "SNACK";
                    else if (hr >= 18 && hr < 22) per = "DINNER";
                    else per = "LATE_NIGHT";

                    if (per.equals(currentPeriod)) {
                        isPeriodMatch = true;
                        break;
                    }
                }

                if (isPeriodMatch) {
                    score += 15.0;
                    reasonCode = "REORDER_PREDICTION";
                    explanation = "Usually ordered around this time";
                }
            }

            reorderList.add(TasteRecommendationDto.builder()
                    .id(itemId)
                    .type("DISH")
                    .data(mi)
                    .score(score)
                    .reasonCodes(List.of(reasonCode))
                    .explanation(explanation)
                    .build());
        }

        reorderList.sort((a, b) -> Double.compare(b.getScore(), a.score));
        return reorderList;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. TREND DETECTION ENGINE (Section 35)
    // ────────────────────────────────────────────────────────────────────────

    public List<TasteRecommendationDto> getTrendingRecommendations(String location) {
        log.info("Running Trend Detection for location={}", location);
        List<MenuItem> items = menuItemRepository.findAll();
        List<Restaurant> restaurants = restaurantRepository.findAll();
        Map<String, Restaurant> restMap = restaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // Group orders in last 3 days to check growth rate
        LocalDateTime since = LocalDateTime.now().minusDays(3);
        List<Order> recentOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedDate().isAfter(since))
                .collect(Collectors.toList());

        Map<String, Integer> itemSales = new HashMap<>();
        for (Order o : recentOrders) {
            for (OrderItem oi : o.getOrderItems()) {
                itemSales.put(oi.getMenuItemId(), itemSales.getOrDefault(oi.getMenuItemId(), 0) + oi.getQuantity());
            }
        }

        List<TasteRecommendationDto> trending = new ArrayList<>();
        for (MenuItem mi : items) {
            if (!mi.isAvailable()) continue;
            Restaurant r = restMap.get(mi.getRestaurantId());
            if (r == null || !isRestaurantOpen(r)) continue;

            if (location != null && r.getCity() != null && !r.getCity().equalsIgnoreCase(location)) continue;

            int salesCount = itemSales.getOrDefault(mi.getId(), 0);
            if (salesCount > 0) {
                double score = 40.0 + salesCount;
                trending.add(TasteRecommendationDto.builder()
                        .id(mi.getId())
                        .type("DISH")
                        .data(mi)
                        .score(score)
                        .reasonCodes(List.of("TRENDING_NOW"))
                        .explanation("Popular order in " + (location != null ? location : "your area"))
                        .build());
            }
        }

        // If nothing is trending, fall back to top rated dishes
        if (trending.isEmpty()) {
            for (MenuItem mi : items) {
                if (!mi.isAvailable()) continue;
                Restaurant r = restMap.get(mi.getRestaurantId());
                if (r == null || !isRestaurantOpen(r)) continue;
                if (location != null && r.getCity() != null && !r.getCity().equalsIgnoreCase(location)) continue;

                if (r.getRating() != null && r.getRating() >= 4.3) {
                    trending.add(TasteRecommendationDto.builder()
                            .id(mi.getId())
                            .type("DISH")
                            .data(mi)
                            .score(40.0 + r.getRating())
                            .reasonCodes(List.of("TRENDING_POPULAR"))
                            .explanation("Top rated choice near you")
                            .build());
                }
            }
        }

        trending.sort((a, b) -> Double.compare(b.getScore(), a.score));
        return trending;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. BUDGET MEAL BUILDER (Section 29 & 30)
    // ────────────────────────────────────────────────────────────────────────

    public List<TasteRecommendationDto> getMealBuilderRecommendations(Long userId, Double budget) {
        log.info("Running Budget Meal Builder for userId={} budget={}", userId, budget);
        double maxBudget = (budget != null) ? budget : 300.0;

        List<MenuItem> allItems = menuItemRepository.findAll();
        List<Restaurant> allRestaurants = restaurantRepository.findAll();

        Map<String, Restaurant> restMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // Group items by restaurant to find combos from the same restaurant
        Map<String, List<MenuItem>> itemsByRestaurant = allItems.stream()
                .filter(MenuItem::isAvailable)
                .collect(Collectors.groupingBy(MenuItem::getRestaurantId));

        List<TasteRecommendationDto> combos = new ArrayList<>();

        for (Map.Entry<String, List<MenuItem>> entry : itemsByRestaurant.entrySet()) {
            String restId = entry.getKey();
            Restaurant r = restMap.get(restId);
            if (r == null || !isRestaurantOpen(r)) continue;

            List<MenuItem> menu = entry.getValue();

            // Categorize into Main, Side, Drink
            List<MenuItem> mains = menu.stream()
                    .filter(i -> i.getCategory() != null && (i.getCategory().toLowerCase().contains("biryani") || i.getCategory().toLowerCase().contains("pizza") || i.getCategory().toLowerCase().contains("burger") || i.getCategory().toLowerCase().contains("meals") || i.getCategory().toLowerCase().contains("thali") || i.getCategory().toLowerCase().contains("curry") || i.getCategory().toLowerCase().contains("sandwich") || i.getCategory().toLowerCase().contains("main")))
                    .collect(Collectors.toList());

            List<MenuItem> sides = menu.stream()
                    .filter(i -> i.getCategory() != null && (i.getCategory().toLowerCase().contains("bread") || i.getCategory().toLowerCase().contains("starter") || i.getCategory().toLowerCase().contains("snack") || i.getCategory().toLowerCase().contains("fries") || i.getCategory().toLowerCase().contains("salad")))
                    .collect(Collectors.toList());

            List<MenuItem> drinks = menu.stream()
                    .filter(i -> i.getCategory() != null && (i.getCategory().toLowerCase().contains("drink") || i.getCategory().toLowerCase().contains("beverage") || i.getCategory().toLowerCase().contains("shake") || i.getCategory().toLowerCase().contains("juice") || i.getCategory().toLowerCase().contains("lassi") || i.getCategory().toLowerCase().contains("dessert")))
                    .collect(Collectors.toList());

            if (mains.isEmpty()) continue;

            // Generate possible combos that fit budget
            for (MenuItem main : mains) {
                if (main.getPrice() > maxBudget) continue;

                // Combo 1: Just Main (if cheap)
                double score = 50.0 + (r.getRating() != null ? r.getRating() : 0.0);
                
                // Combo 2: Main + Drink
                for (MenuItem drink : drinks) {
                    double pairPrice = main.getPrice() + drink.getPrice();
                    if (pairPrice <= maxBudget) {
                        combos.add(TasteRecommendationDto.builder()
                                .id(main.getId() + "_" + drink.getId())
                                .type("DISH")
                                .score(score + 15.0)
                                .reasonCodes(List.of("BUDGET_COMBO"))
                                .explanation("Combo: " + main.getName() + " + " + drink.getName() + " (Total: ₹" + Math.round(pairPrice) + ") from " + r.getName())
                                .data(List.of(main, drink))
                                .build());
                    }
                }

                // Combo 3: Main + Side + Drink
                for (MenuItem side : sides) {
                    for (MenuItem drink : drinks) {
                        double tripPrice = main.getPrice() + side.getPrice() + drink.getPrice();
                        if (tripPrice <= maxBudget) {
                            combos.add(TasteRecommendationDto.builder()
                                    .id(main.getId() + "_" + side.getId() + "_" + drink.getId())
                                    .type("DISH")
                                    .score(score + 25.0)
                                    .reasonCodes(List.of("BUDGET_COMBO_FULL"))
                                    .explanation("Full Meal: " + main.getName() + " + " + side.getName() + " + " + drink.getName() + " (Total: ₹" + Math.round(tripPrice) + ") from " + r.getName())
                                    .data(List.of(main, side, drink))
                                    .build());
                        }
                    }
                }
            }
        }

        combos.sort((a, b) -> Double.compare(b.getScore(), a.score));
        return combos;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 8. TASTE OUTCOME TRACKING & FEEDBACK (Section 40, 41, 42)
    // ────────────────────────────────────────────────────────────────────────

    @Transactional
    public void logFeedback(Long userId, String itemId, String itemType, String actionType) {
        log.info("Logging feedback for userId={} itemId={} actionType={}", userId, itemId, actionType);
        
        // Save feedback override to DB
        feedbackRepository.save(RecommendationFeedback.builder()
                .userId(userId)
                .itemId(itemId)
                .itemType(itemType != null ? itemType : "DISH")
                .actionType(actionType.toUpperCase())
                .timestamp(LocalDateTime.now())
                .build());

        // Process preference adjustments based on action types (LOVED_IT vs NOT_FOR_ME)
        UserTasteProfile profile = tasteProfileRepository.findByUserId(String.valueOf(userId))
                .orElseGet(() -> tasteProfileRepository.save(UserTasteProfile.builder()
                        .userId(String.valueOf(userId))
                        .lastUpdated(LocalDateTime.now())
                        .build()));

        if ("DISLIKE".equalsIgnoreCase(actionType) || "NOT_FOR_ME".equalsIgnoreCase(actionType) || "TOO_SPICY".equalsIgnoreCase(actionType)) {
            // Exclude item by saving it in avoids/exclusions
            preferenceOverrideRepository.save(UserPreferenceOverride.builder()
                    .userId(userId)
                    .preferenceKey("EXCLUDED_INGREDIENT")
                    .preferenceValue(itemId)
                    .createdAt(LocalDateTime.now())
                    .build());
            
            // Penalty in taste history
            saveHistoryLog(userId, "DISLIKE", itemId, 1.0, 0.0);
        } else if ("LIKE".equalsIgnoreCase(actionType) || "LOVED_IT".equalsIgnoreCase(actionType) || "MORE_LIKE_THIS".equalsIgnoreCase(actionType)) {
            // Increment item frequency
            profile.getFrequentItems().put(itemId, profile.getFrequentItems().getOrDefault(itemId, 0) + 2);
            profile.setLastUpdated(LocalDateTime.now());
            tasteProfileRepository.save(profile);
            
            saveHistoryLog(userId, "LIKE", itemId, 0.0, 1.0);
        }
    }

    private void saveHistoryLog(Long userId, String type, String item, Double oldVal, Double newVal) {
        tasteHistoryRepository.save(UserTasteHistory.builder()
                .userId(userId)
                .version(1L)
                .changedDimensionType(type)
                .changedDimensionKey(item)
                .oldValue(oldVal)
                .newValue(newVal)
                .timestamp(LocalDateTime.now())
                .build());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 9. SMART CART RECOMMENDATIONS (Section 27 & 28)
    // ────────────────────────────────────────────────────────────────────────

    public List<TasteRecommendationDto> getCartRecommendations(List<String> cartItemIds) {
        log.info("Generating smart cart cross-sell recommendations for cartItemIds={}", cartItemIds);
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<MenuItem> allMenuItems = menuItemRepository.findAll();
        Map<String, MenuItem> itemMap = allMenuItems.stream()
                .collect(Collectors.toMap(MenuItem::getId, i -> i, (i1, i2) -> i1));

        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        Map<String, Restaurant> restaurantMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        // Get details of items already in cart
        List<MenuItem> cartItems = cartItemIds.stream()
                .map(itemMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (cartItems.isEmpty()) return new ArrayList<>();

        // Recommendations should be from the same restaurant as the items in cart to prevent multiple deliveries
        String restaurantId = cartItems.get(0).getRestaurantId();
        Restaurant r = restaurantMap.get(restaurantId);
        if (r == null || !isRestaurantOpen(r)) return new ArrayList<>();

        List<MenuItem> restMenu = allMenuItems.stream()
                .filter(i -> i.getRestaurantId().equals(restaurantId) && i.isAvailable())
                .collect(Collectors.toList());

        List<TasteRecommendationDto> suggestions = new ArrayList<>();
        Set<String> cartCategorySet = cartItems.stream().map(MenuItem::getCategory).collect(Collectors.toSet());

        for (MenuItem item : restMenu) {
            // Do not recommend items already in the cart
            if (cartItemIds.contains(item.getId())) continue;

            double score = 30.0;
            String reasonCode = "COMPLEMENTARY";
            String explanation = "Complements your cart items";

            String cat = item.getCategory() != null ? item.getCategory().toLowerCase() : "";
            
            // Up-sell sides or drinks
            if (cat.contains("drink") || cat.contains("beverage") || cat.contains("juice") || cat.contains("shake") || cat.contains("cola") || cat.contains("pepsi") || cat.contains("soda")) {
                score += 30.0;
                reasonCode = "DRINK_ADDON";
                explanation = "Complete your meal with a refreshing drink";
            } else if (cat.contains("fry") || cat.contains("fries") || cat.contains("bread") || cat.contains("snack") || cat.contains("starter") || cat.contains("bite")) {
                score += 20.0;
                reasonCode = "SIDE_ADDON";
                explanation = "Add a quick side dish";
            } else if (cat.contains("dessert") || cat.contains("sweet") || cat.contains("cake") || cat.contains("ice cream")) {
                score += 25.0;
                reasonCode = "DESSERT_ADDON";
                explanation = "Treat yourself with a dessert";
            }

            // Price restriction: addons should usually be cheaper than main cart items
            double maxCartPrice = cartItems.stream().mapToDouble(MenuItem::getPrice).max().orElse(100.0);
            if (item.getPrice() > maxCartPrice * 0.8) {
                score -= 10.0; // penalty if too expensive
            }

            suggestions.add(TasteRecommendationDto.builder()
                    .id(item.getId())
                    .type("DISH")
                    .data(item)
                    .score(score)
                    .reasonCodes(List.of(reasonCode))
                    .explanation(explanation)
                    .build());
        }

        suggestions.sort((a, b) -> Double.compare(b.getScore(), a.score));
        return suggestions.stream().limit(5).collect(Collectors.toList());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 10. NATURAL LANGUAGE CRAVING PARSER (Section 16 & 17)
    // ────────────────────────────────────────────────────────────────────────

    public Map<String, Object> parseNaturalLanguageQuery(String query, Long userId) {
        log.info("Parsing natural language craving discovery query='{}' for userId={}", query, userId);
        
        // Protect against prompt injection (do not execute direct LLM tool calling here, use strict regex/rules mapping)
        // Extract filters using regex patterns
        List<String> cuisinesList = new ArrayList<>();
        List<String> dishesList = new ArrayList<>();
        Double budgetMax = null;
        String spiceLevel = "MEDIUM";
        String mealStyle = "MEDIUM";
        List<String> excludedIngredients = new ArrayList<>();
        boolean vegetarian = false;

        String queryLower = query.toLowerCase();

        // 1. Budget extraction
        Pattern budgetPattern = Pattern.compile("(?:under|below|less than|within|price|budget|rs|inr|rs\\.)\\s*(\\d+)");
        Matcher budgetMatcher = budgetPattern.matcher(queryLower);
        if (budgetMatcher.find()) {
            try {
                budgetMax = Double.parseDouble(budgetMatcher.group(1));
            } catch (NumberFormatException ignored) {}
        }

        // 2. Spice preference extraction
        if (queryLower.contains("spicy") || queryLower.contains("chili") || queryLower.contains("hot") || queryLower.contains("tikha")) {
            spiceLevel = "HIGH";
        } else if (queryLower.contains("mild") || queryLower.contains("sweet") || queryLower.contains("not spicy") || queryLower.contains("bina tikha")) {
            spiceLevel = "LOW";
        }

        // 3. Meal style extraction
        if (queryLower.contains("light") || queryLower.contains("healthy") || queryLower.contains("diet") || queryLower.contains("low calorie")) {
            mealStyle = "LIGHT";
        } else if (queryLower.contains("heavy") || queryLower.contains("filling") || queryLower.contains("full meal") || queryLower.contains("cheat meal")) {
            mealStyle = "HEAVY";
        }

        // 4. Vegetarian detection
        if (queryLower.contains("veg") || queryLower.contains("vegetarian") || queryLower.contains("shakahari")) {
            vegetarian = true;
        }

        // 5. Cuisine detection
        String[] knownCuisines = {"indian", "chinese", "italian", "american", "mexican", "thai", "japanese", "south indian", "north indian", "mughlai", "continental"};
        for (String c : knownCuisines) {
            if (queryLower.contains(c)) {
                cuisinesList.add(c.toUpperCase());
            }
        }

        // 6. Dish type detection
        String[] knownDishes = {"biryani", "pizza", "burger", "pasta", "paneer", "chicken", "salad", "noodle", "noodels", "fries", "dosa", "momos", "roll", "rolls", "dessert", "cake", "ice cream", "beverage", "beverages", "drink", "drinks", "cola", "juice"};
        for (String d : knownDishes) {
            if (queryLower.contains(d)) {
                dishesList.add(d);
            }
        }

        // 7. Ingredient exclusions
        Pattern exclusionPattern = Pattern.compile("(?:no|without|avoid|except|exclude)\\s+([a-z]+)");
        Matcher exclusionMatcher = exclusionPattern.matcher(queryLower);
        while (exclusionMatcher.find()) {
            excludedIngredients.add(exclusionMatcher.group(1));
        }

        ParsedIntentDto intent = ParsedIntentDto.builder()
                .cuisines(cuisinesList)
                .dishes(dishesList)
                .budgetMax(budgetMax)
                .spiceLevel(spiceLevel)
                .mealStyle(mealStyle)
                .excludedIngredients(excludedIngredients)
                .vegetarian(vegetarian)
                .build();

        log.info("Parsed intent context: {}", intent);

        // Fetch candidate menu items and apply filter matching
        List<MenuItem> allItems = menuItemRepository.findAll();
        List<Restaurant> allRestaurants = restaurantRepository.findAll();
        Map<String, Restaurant> restaurantMap = allRestaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r, (r1, r2) -> r1));

        List<TasteRecommendationDto> results = new ArrayList<>();

        for (MenuItem item : allItems) {
            if (!item.isAvailable()) continue;
            Restaurant r = restaurantMap.get(item.getRestaurantId());
            if (r == null || !isRestaurantOpen(r)) continue;

            // Apply vegetarian filter if matching
            if (vegetarian && !item.isVegetarian()) continue;

            // Apply budget filter if matching
            if (budgetMax != null && item.getPrice() > budgetMax) continue;

            // Exclusion check
            String itemText = (item.getName() + " " + item.getDescription() + " " + (item.getCategory() != null ? item.getCategory() : "")).toLowerCase();
            boolean excluded = false;
            for (String exc : excludedIngredients) {
                if (itemText.contains(exc)) {
                    excluded = true;
                    break;
                }
            }
            if (excluded) continue;

            // Scoring intent matches
            double score = 40.0;
            List<String> reasonCodes = new ArrayList<>();
            List<String> explanations = new ArrayList<>();

            // Dish match
            boolean dishMatched = false;
            for (String d : dishesList) {
                if (itemText.contains(d)) {
                    score += 30.0;
                    dishMatched = true;
                }
            }
            if (dishMatched) {
                reasonCodes.add("CRAVING_MATCH");
                explanations.add("Matches your direct craving");
            }

            // Cuisine match
            boolean cuisineMatched = false;
            for (String c : cuisinesList) {
                if (r.getCuisineType() != null && r.getCuisineType().toLowerCase().contains(c.toLowerCase())) {
                    score += 20.0;
                    cuisineMatched = true;
                }
            }
            if (cuisineMatched) {
                reasonCodes.add("CUISINE_MATCH");
                explanations.add("Matches cuisine type");
            }

            // Spice level match
            if ("HIGH".equalsIgnoreCase(spiceLevel) && (itemText.contains("spicy") || itemText.contains("chili") || itemText.contains("hot"))) {
                score += 10.0;
                reasonCodes.add("SPICE_MATCH");
            }

            // Meal style match
            if ("LIGHT".equalsIgnoreCase(mealStyle) && (itemText.contains("healthy") || itemText.contains("light") || itemText.contains("salad"))) {
                score += 10.0;
                reasonCodes.add("LIGHT_STYLE");
            }

            // Fallback matching: if no direct craving matched but name contains elements of search, keep it
            if (dishesList.isEmpty() && cuisinesList.isEmpty()) {
                // Keep if name matches search terms
                String[] words = queryLower.split("\\s+");
                boolean keywordMatch = false;
                for (String w : words) {
                    if (w.length() > 3 && itemText.contains(w)) {
                        score += 5.0;
                        keywordMatch = true;
                    }
                }
                if (!keywordMatch) continue; // skip if nothing matches keyword search
            } else {
                // If specific dishes/cuisines were asked, must match at least one of them to be relevant
                if (!dishMatched && !cuisineMatched) {
                    continue;
                }
            }

            results.add(TasteRecommendationDto.builder()
                    .id(item.getId())
                    .type("DISH")
                    .data(item)
                    .score(score)
                    .reasonCodes(reasonCodes)
                    .explanation(explanations.isEmpty() ? "Matches search query" : String.join(", ", explanations))
                    .build());
        }

        results.sort((a, b) -> Double.compare(b.getScore(), a.score));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("parsedIntent", intent);
        response.put("results", results.stream().limit(10).collect(Collectors.toList()));
        return response;
    }
}
