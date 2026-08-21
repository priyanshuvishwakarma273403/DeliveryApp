package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.request.CartItemRequest;
import com.delivery.foodDelivery.dto.response.CartResponse;
import static com.delivery.foodDelivery.dto.response.AiToolDtos.*;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.repository.jpa.UserTasteProfileRepository;
import com.delivery.foodDelivery.repository.mongo.CashbackCampaignRepository;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import com.delivery.foodDelivery.observability.metrics.AiMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FoodConciergeToolService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserTasteProfileRepository tasteProfileRepository;
    private final OrderRepository orderRepository;
    private final CashbackCampaignRepository campaignRepository;
    private final CartService cartService;
    private final AiMetrics aiMetrics;
    
    // Digital Twin injection
    private final com.delivery.foodDelivery.repository.jpa.RestaurantDigitalTwinStateRepository twinStateRepository;
    private final com.delivery.foodDelivery.repository.jpa.RestaurantForecastRepository forecastRepository;
    private final com.delivery.foodDelivery.repository.jpa.RestaurantKitchenMetricRepository kitchenMetricRepository;
    private final com.delivery.foodDelivery.repository.jpa.RestaurantInventoryMetricRepository inventoryMetricRepository;
    private final com.delivery.foodDelivery.repository.jpa.RestaurantAnomalyRepository anomalyRepository;
    private final DigitalTwinService digitalTwinService;

    // Timeout protection executor
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public Object executeTool(String toolName, Map<String, Object> args, Long currentUserId) throws Exception {
        aiMetrics.incrementToolCalls(toolName);
        long startTime = System.currentTimeMillis();
        
        Callable<Object> task = () -> {
            switch (toolName) {
                case "searchRestaurants":
                    return searchRestaurantsTool((String) args.get("query"), (String) args.get("city"));
                case "searchDishes":
                    return searchDishesTool(
                            (String) args.get("query"),
                            (String) args.get("category"),
                            args.get("maxPrice") != null ? Double.valueOf(args.get("maxPrice").toString()) : null,
                            args.get("vegetarian") != null ? Boolean.valueOf(args.get("vegetarian").toString()) : null
                    );
                case "getRestaurant":
                    return getRestaurantTool((String) args.get("restaurantId"));
                case "getDish":
                    return getDishTool((String) args.get("dishId"));
                case "getMenu":
                    return getMenuTool((String) args.get("restaurantId"));
                case "checkDishAvailability":
                    return checkDishAvailabilityTool((String) args.get("dishId"));
                case "getEstimatedDeliveryTime":
                    return getEstimatedDeliveryTimeTool((String) args.get("restaurantId"), currentUserId);
                case "getUserTasteProfile":
                    return getUserTasteProfileTool(currentUserId);
                case "getUserOrderHistory":
                    return getUserOrderHistoryTool(currentUserId);
                case "getNearbyRestaurants":
                    return getNearbyRestaurantsTool((String) args.get("city"));
                case "getCurrentOffers":
                    return getCurrentOffersTool((String) args.get("restaurantId"));
                case "calculateCartTotal":
                    return calculateCartTotalTool(parseCartItemsList(args.get("items")));
                case "createDraftCart":
                    return createDraftCartTool(currentUserId, (String) args.get("restaurantId"), parseCartItemsList(args.get("items")));
                case "getSimilarDishes":
                    return getSimilarDishesTool((String) args.get("dishId"));
                case "getRestaurantHealth":
                    return getRestaurantHealthTool((String) args.get("restaurantId"));
                case "getDemandForecast":
                    return getDemandForecastTool((String) args.get("restaurantId"));
                case "getRecentDemand":
                    return getRecentDemandTool((String) args.get("restaurantId"));
                case "getInventoryRisk":
                    return getInventoryRiskTool((String) args.get("restaurantId"));
                case "getKitchenState":
                    return getKitchenStateTool((String) args.get("restaurantId"));
                case "getAnomalies":
                    return getAnomaliesTool((String) args.get("restaurantId"));
                case "getPromotionImpact":
                    return getPromotionImpactTool((String) args.get("restaurantId"));
                default:
                    throw new IllegalArgumentException("Unknown tool: " + toolName);
            }
        };

        try {
            // Timeout limit of 5 seconds for any tool execution to protect backend thread exhaustion
            Future<Object> future = executor.submit(task);
            Object result = future.get(5000, TimeUnit.MILLISECONDS);
            log.info("Tool {} completed successfully in {} ms", toolName, (System.currentTimeMillis() - startTime));
            return result;
        } catch (TimeoutException e) {
            aiMetrics.incrementToolFailures(toolName);
            log.error("Tool {} execution timed out", toolName);
            return Map.of("error", "Execution timed out. Please try simplifying your request.");
        } catch (Exception e) {
            aiMetrics.incrementToolFailures(toolName);
            log.error("Tool {} execution failed: {}", toolName, e.getMessage(), e);
            return Map.of("error", "Tool execution failed: " + e.getMessage());
        }
    }

    private List<CartItemRequest> parseCartItemsList(Object itemsObj) {
        if (itemsObj == null) return Collections.emptyList();
        List<CartItemRequest> items = new ArrayList<>();
        if (itemsObj instanceof List) {
            for (Object obj : (List<?>) itemsObj) {
                if (obj instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) obj;
                    CartItemRequest req = new CartItemRequest();
                    req.setMenuItemId((String) map.get("menuItemId"));
                    req.setQuantity(map.get("quantity") != null ? Integer.valueOf(map.get("quantity").toString()) : 1);
                    items.add(req);
                }
            }
        }
        return items;
    }

    // 1. searchRestaurants(query, city)
    public List<RestaurantToolDto> searchRestaurantsTool(String query, String city) {
        log.info("Executing searchRestaurants tool with query: {} in city: {}", query, city);
        List<Restaurant> list;
        if (city != null && !city.isBlank()) {
            list = restaurantRepository.findByCity(city);
        } else {
            list = restaurantRepository.findAll();
        }

        if (query != null && !query.isBlank()) {
            String lowerQuery = query.toLowerCase();
            list = list.stream()
                    .filter(r -> r.getName().toLowerCase().contains(lowerQuery) ||
                            (r.getCuisineType() != null && r.getCuisineType().toLowerCase().contains(lowerQuery)))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::mapToRestaurantToolDto).collect(Collectors.toList());
    }

    // 2. searchDishes(query, category, maxPrice, vegetarian)
    public List<DishToolDto> searchDishesTool(String query, String category, Double maxPrice, Boolean vegetarian) {
        log.info("Executing searchDishes tool with query: {}, category: {}, maxPrice: {}, vegetarian: {}",
                query, category, maxPrice, vegetarian);
        
        List<MenuItem> items = menuItemRepository.findAll();

        return items.stream()
                .filter(MenuItem::isAvailable)
                .filter(item -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase();
                        boolean nameMatch = item.getName() != null && item.getName().toLowerCase().contains(q);
                        boolean descMatch = item.getDescription() != null && item.getDescription().toLowerCase().contains(q);
                        if (!nameMatch && !descMatch) return false;
                    }
                    if (category != null && !category.isBlank()) {
                        if (item.getCategory() == null || !item.getCategory().equalsIgnoreCase(category)) return false;
                    }
                    if (maxPrice != null) {
                        if (item.getPrice() == null || item.getPrice() > maxPrice) return false;
                    }
                    if (vegetarian != null) {
                        if (item.isVegetarian() != vegetarian) return false;
                    }
                    return true;
                })
                .limit(10)
                .map(this::mapToDishToolDto)
                .collect(Collectors.toList());
    }

    // 3. getRestaurant(restaurantId)
    public RestaurantToolDto getRestaurantTool(String restaurantId) {
        log.info("Executing getRestaurant tool for id: {}", restaurantId);
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with ID: " + restaurantId));
        return mapToRestaurantToolDto(r);
    }

    // 4. getDish(dishId)
    public DishToolDto getDishTool(String dishId) {
        log.info("Executing getDish tool for id: {}", dishId);
        MenuItem item = menuItemRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found with ID: " + dishId));
        return mapToDishToolDto(item);
    }

    // 5. getMenu(restaurantId)
    public List<DishToolDto> getMenuTool(String restaurantId) {
        log.info("Executing getMenu tool for restaurantId: {}", restaurantId);
        List<MenuItem> items = menuItemRepository.findByRestaurantId(restaurantId);
        return items.stream().map(this::mapToDishToolDto).collect(Collectors.toList());
    }

    // 6. checkDishAvailability(dishId)
    public Map<String, Object> checkDishAvailabilityTool(String dishId) {
        log.info("Executing checkDishAvailability tool for id: {}", dishId);
        MenuItem item = menuItemRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found with ID: " + dishId));
        return Map.of("dishId", dishId, "available", item.isAvailable(), "name", item.getName());
    }

    // 7. getEstimatedDeliveryTime(restaurantId, userId)
    public Map<String, Object> getEstimatedDeliveryTimeTool(String restaurantId, Long userId) {
        log.info("Executing getEstimatedDeliveryTime tool for restaurantId: {}", restaurantId);
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with ID: " + restaurantId));
        int mins = r.getAvgDeliveryTime() != null ? r.getAvgDeliveryTime() : 35;
        // Mock distance variance
        double distanceKm = 1.5 + (Math.abs(restaurantId.hashCode()) % 5);
        return Map.of(
                "restaurantId", restaurantId,
                "restaurantName", r.getName(),
                "estimatedDeliveryMinutes", mins,
                "distanceKm", Math.round(distanceKm * 10.0) / 10.0
        );
    }

    // 8. getUserTasteProfile(userId)
    public UserTasteProfileToolDto getUserTasteProfileTool(Long userId) {
        log.info("Executing getUserTasteProfile tool for userId: {}", userId);
        UserTasteProfile profile = tasteProfileRepository.findByUserId("user-" + userId)
                .orElseGet(() -> {
                    UserTasteProfile p = UserTasteProfile.builder()
                            .userId("user-" + userId)
                            .preferredCuisines(new ArrayList<>())
                            .preferredCategories(new ArrayList<>())
                            .dietaryPreferences(new ArrayList<>())
                            .budgetTier("MEDIUM")
                            .lastUpdated(LocalDateTime.now())
                            .build();
                    return tasteProfileRepository.save(p);
                });
        return UserTasteProfileToolDto.builder()
                .preferredCuisines(profile.getPreferredCuisines())
                .preferredCategories(profile.getPreferredCategories())
                .dietaryPreferences(profile.getDietaryPreferences())
                .budgetTier(profile.getBudgetTier())
                .frequentRestaurants(profile.getFrequentRestaurants())
                .build();
    }

    // 9. getUserOrderHistory(userId)
    public List<OrderToolDto> getUserOrderHistoryTool(Long userId) {
        log.info("Executing getUserOrderHistory tool for userId: {}", userId);
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedDateDesc(userId);
        
        // Find restaurant names in bulk
        Set<String> restaurantIds = orders.stream()
                .map(Order::getRestaurantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
                
        Map<String, String> restaurantNames = new HashMap<>();
        restaurantRepository.findAllById(restaurantIds).forEach(r -> restaurantNames.put(r.getId(), r.getName()));

        return orders.stream()
                .limit(5)
                .map(o -> {
                    List<OrderItemToolDto> items = o.getOrderItems().stream()
                            .map(item -> {
                                String name = "Item " + item.getMenuItemId();
                                try {
                                    Optional<MenuItem> m = menuItemRepository.findById(item.getMenuItemId());
                                    if (m.isPresent()) name = m.get().getName();
                                } catch(Exception ignored) {}
                                
                                return OrderItemToolDto.builder()
                                        .menuItemName(name)
                                        .quantity(item.getQuantity())
                                        .price(item.getPriceAtOrderTime())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return OrderToolDto.builder()
                            .id(o.getId())
                            .status(o.getStatus().name())
                            .totalAmount(o.getTotalAmount())
                            .finalAmount(o.getFinalAmount())
                            .createdDate(o.getCreatedDate())
                            .items(items)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // 10. getNearbyRestaurants(city)
    public List<RestaurantToolDto> getNearbyRestaurantsTool(String city) {
        log.info("Executing getNearbyRestaurants tool for city: {}", city);
        if (city == null || city.isBlank()) {
            city = "Noida"; // Default fallback
        }
        List<Restaurant> list = restaurantRepository.findByCity(city);
        return list.stream()
                .filter(Restaurant::isOpen)
                .sorted((r1, r2) -> Double.compare(r2.getRating() != null ? r2.getRating() : 0.0, r1.getRating() != null ? r1.getRating() : 0.0))
                .limit(10)
                .map(this::mapToRestaurantToolDto)
                .collect(Collectors.toList());
    }

    // 11. getCurrentOffers(restaurantId)
    public List<OfferToolDto> getCurrentOffersTool(String restaurantId) {
        log.info("Executing getCurrentOffers tool for restaurantId: {}", restaurantId);
        List<CashbackCampaign> campaigns = campaignRepository.findByActive(true);
        
        List<OfferToolDto> offers = campaigns.stream()
                .map(c -> OfferToolDto.builder()
                        .id(c.getId())
                        .title(c.getName())
                        .description(c.getType() != null ? c.getType() + " Cashback Campaign" : "Special Cashback Offer")
                        .discountPercentage(c.getCashbackPercentage())
                        .minOrderValue(c.getMinOrderAmount())
                        .build())
                .collect(Collectors.toList());

        // Add default mock offer if database is empty
        if (offers.isEmpty()) {
            offers.add(OfferToolDto.builder()
                    .id("default_promo_1")
                    .title("FIRST50")
                    .description("Get 50% discount up to Rs. 100 on your first order.")
                    .discountPercentage(50.0)
                    .minOrderValue(150.0)
                    .build());
            offers.add(OfferToolDto.builder()
                    .id("default_promo_2")
                    .title("FREEDEL")
                    .description("Free delivery on orders above Rs. 200.")
                    .discountPercentage(100.0)
                    .minOrderValue(200.0)
                    .build());
        }
        return offers;
    }

    // 12. calculateCartTotal(items)
    public Map<String, Object> calculateCartTotalTool(List<CartItemRequest> items) {
        log.info("Executing calculateCartTotal tool for {} items", items.size());
        double subtotal = 0.0;
        List<Map<String, Object>> breakdown = new ArrayList<>();
        
        for (CartItemRequest req : items) {
            Optional<MenuItem> itemOpt = menuItemRepository.findById(req.getMenuItemId());
            if (itemOpt.isPresent()) {
                MenuItem item = itemOpt.get();
                double cost = item.getPrice() * req.getQuantity();
                subtotal += cost;
                breakdown.add(Map.of(
                        "itemId", item.getId(),
                        "name", item.getName(),
                        "unitPrice", item.getPrice(),
                        "quantity", req.getQuantity(),
                        "subtotal", cost
                ));
            }
        }
        
        double deliveryFee = subtotal > 200 ? 0.0 : 30.0;
        double tax = Math.round((subtotal * 0.05) * 100.0) / 100.0; // 5% GST
        double total = subtotal + deliveryFee + tax;

        return Map.of(
                "subtotal", subtotal,
                "deliveryFee", deliveryFee,
                "gstTax5Percent", tax,
                "totalAmount", Math.round(total * 100.0) / 100.0,
                "items", breakdown
        );
    }

    // 13. createDraftCart(userId, restaurantId, items)
    public CartResponse createDraftCartTool(Long userId, String restaurantId, List<CartItemRequest> items) {
        log.info("Executing createDraftCart tool for userId: {}, restaurantId: {}, itemsCount: {}",
                userId, restaurantId, items.size());
        
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Cannot create an empty draft cart");
        }

        // Validate all items belong to same restaurant
        for (CartItemRequest req : items) {
            MenuItem item = menuItemRepository.findById(req.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Dish not found: " + req.getMenuItemId()));
            if (!item.getRestaurantId().equals(restaurantId)) {
                throw new IllegalArgumentException(String.format("Dish '%s' does not belong to restaurant '%s'", item.getName(), restaurantId));
            }
            if (!item.isAvailable()) {
                throw new IllegalArgumentException(String.format("Dish '%s' is not available", item.getName()));
            }
        }

        // Clear existing cart first
        cartService.clearCart(userId);

        // Add items one by one
        CartResponse lastResponse = null;
        for (CartItemRequest req : items) {
            lastResponse = cartService.addItem(userId, req);
        }

        return lastResponse;
    }

    // 14. getSimilarDishes(dishId)
    public List<DishToolDto> getSimilarDishesTool(String dishId) {
        log.info("Executing getSimilarDishes tool for dishId: {}", dishId);
        MenuItem target = menuItemRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found: " + dishId));
        
        List<MenuItem> all = menuItemRepository.findAll();
        return all.stream()
                .filter(MenuItem::isAvailable)
                .filter(i -> !i.getId().equals(dishId))
                .filter(i -> i.getCategory() != null && i.getCategory().equalsIgnoreCase(target.getCategory()))
                .limit(5)
                .map(this::mapToDishToolDto)
                .collect(Collectors.toList());
    }

    // --- Helper Mappers ---
    private RestaurantToolDto mapToRestaurantToolDto(Restaurant r) {
        return RestaurantToolDto.builder()
                .id(r.getId())
                .name(r.getName())
                .cuisine(r.getCuisineType())
                .rating(r.getRating())
                .avgDeliveryTime(r.getAvgDeliveryTime())
                .city(r.getCity())
                .minOrderAmount(r.getMinOrderAmount())
                .open(r.isOpen())
                .build();
    }

    private DishToolDto mapToDishToolDto(MenuItem item) {
        String restaurantName = null;
        if (item.getRestaurantId() != null) {
            try {
                Restaurant r = restaurantRepository.findById(item.getRestaurantId()).orElse(null);
                if (r != null) restaurantName = r.getName();
            } catch(Exception ignored) {}
        }
        return DishToolDto.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .available(item.isAvailable())
                .vegetarian(item.isVegetarian())
                .restaurantId(item.getRestaurantId())
                .restaurantName(restaurantName)
                .build();
    }

    // --- Digital Twin Tool Implementations (Section 43) ---

    public Map<String, Object> getRestaurantHealthTool(String restaurantId) {
        log.info("Executing AI Tool getRestaurantHealth for restaurantId: {}", restaurantId);
        // Ensure state is calculated
        digitalTwinService.updateAndBroadcastTwinState(restaurantId);
        RestaurantDigitalTwinState state = twinStateRepository.findByRestaurantId(restaurantId).orElse(null);
        if (state == null) {
            return Map.of("error", "Digital Twin state not initialized for restaurant: " + restaurantId);
        }
        return Map.of(
            "restaurantId", restaurantId,
            "status", state.getStatus(),
            "healthScore", state.getHealthScore(),
            "activeOrders", state.getActiveOrders(),
            "averagePreparationTimeMinutes", state.getAveragePreparationTime() != null ? state.getAveragePreparationTime() : 15.0,
            "kitchenUtilizationPercentage", Math.round(state.getKitchenUtilization() * 100),
            "staffUtilizationPercentage", Math.round(state.getStaffUtilization() * 100),
            "inventoryRiskLevel", state.getInventoryRisk(),
            "slaBreachRiskProbability", state.getSlaRisk()
        );
    }

    public List<Map<String, Object>> getDemandForecastTool(String restaurantId) {
        log.info("Executing AI Tool getDemandForecast for restaurantId: {}", restaurantId);
        List<RestaurantForecast> list = forecastRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> results = new ArrayList<>();
        for (RestaurantForecast f : list) {
            results.add(Map.of(
                "horizon", f.getHorizon(),
                "predictedOrders", f.getPredictedOrders(),
                "confidence", f.getConfidence(),
                "trend", f.getTrend(),
                "modelVersion", f.getModelVersion(),
                "generatedAt", f.getGeneratedAt().toString()
            ));
        }
        return results;
    }

    public Map<String, Long> getRecentDemandTool(String restaurantId) {
        log.info("Executing AI Tool getRecentDemand for restaurantId: {}", restaurantId);
        return digitalTwinService.calculateSlidingDemand(restaurantId);
    }

    public List<Map<String, Object>> getInventoryRiskTool(String restaurantId) {
        log.info("Executing AI Tool getInventoryRisk for restaurantId: {}", restaurantId);
        List<RestaurantInventoryMetric> metrics = inventoryMetricRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> results = new ArrayList<>();
        for (RestaurantInventoryMetric m : metrics) {
            results.add(Map.of(
                "ingredientName", m.getIngredientName(),
                "currentQuantity", m.getCurrentQuantity(),
                "reservedQuantity", m.getReservedQuantity(),
                "availableQuantity", m.getAvailableQuantity(),
                "unit", m.getUnit(),
                "reorderThreshold", m.getReorderThreshold(),
                "estimatedStockoutMinutes", m.getEstimatedStockoutMinutes()
            ));
        }
        return results;
    }

    public List<Map<String, Object>> getKitchenStateTool(String restaurantId) {
        log.info("Executing AI Tool getKitchenState for restaurantId: {}", restaurantId);
        List<RestaurantKitchenMetric> metrics = kitchenMetricRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> results = new ArrayList<>();
        for (RestaurantKitchenMetric m : metrics) {
            results.add(Map.of(
                "stationName", m.getStationName(),
                "capacity", m.getCapacity(),
                "activeOrdersCount", m.getActiveOrders(),
                "stationUtilizationPercentage", Math.round(m.getUtilization() * 100),
                "timestamp", m.getTimestamp().toString()
            ));
        }
        return results;
    }

    public List<Map<String, Object>> getAnomaliesTool(String restaurantId) {
        log.info("Executing AI Tool getAnomalies for restaurantId: {}", restaurantId);
        List<RestaurantAnomaly> anomalies = anomalyRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> results = new ArrayList<>();
        for (RestaurantAnomaly a : anomalies) {
            results.add(Map.of(
                "anomalyType", a.getAnomalyType(),
                "metricName", a.getMetricName(),
                "expectedValue", a.getExpectedValue(),
                "actualValue", a.getActualValue(),
                "detectedAt", a.getDetectedAt().toString(),
                "description", a.getDescription(),
                "potentialCauses", a.getPotentialCauses()
            ));
        }
        return results;
    }

    public Map<String, Object> getPromotionImpactTool(String restaurantId) {
        log.info("Executing AI Tool getPromotionImpact for restaurantId: {}", restaurantId);
        // Returns simulated promotions or historical promotion impacts
        return Map.of(
            "restaurantId", restaurantId,
            "promotionMultiplier", 1.20, // +20% demand during promotions
            "estimatedSlaRiskIncrease", 0.15, // Utilization increases risk by 15%
            "inventoryDepletionRateFactor", 1.25 // depletion accelerates by 25%
        );
    }
}
