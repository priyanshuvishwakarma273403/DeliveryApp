package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.DigitalTwinEventDto;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.service.forecast.DemandForecastModel;
import com.delivery.foodDelivery.service.forecast.BaselineForecastModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class DigitalTwinService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    
    private final RestaurantDigitalTwinStateRepository twinStateRepository;
    private final RestaurantKitchenMetricRepository kitchenMetricRepository;
    private final RestaurantInventoryMetricRepository inventoryMetricRepository;
    private final RestaurantStaffMetricRepository staffMetricRepository;
    private final RestaurantForecastRepository forecastRepository;
    private final RestaurantRiskEventRepository riskEventRepository;
    private final RestaurantAnomalyRepository anomalyRepository;
    private final RestaurantSimulationRepository simulationRepository;
    private final RestaurantOperationalRecommendationRepository recommendationRepository;
    
    private final DigitalTwinRedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;
    private final List<DemandForecastModel> forecastModels;
    private final ObjectMapper objectMapper;

    // Idempotency: Keep track of processed Kafka event IDs to prevent duplicate processing
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    // Learned preparation times (dishId -> Average minutes)
    private final Map<String, Double> learnedPrepTimes = new ConcurrentHashMap<>();

    /**
     * Entry point for incoming digital twin events from Kafka.
     * Implements idempotency check, updates the twin states, evaluates risks/anomalies,
     * writes to MySQL & Redis, and broadcasts WebSocket messages.
     */
    @Transactional
    public void processEvent(DigitalTwinEventDto event) {
        if (event == null || event.getEventId() == null) {
            return;
        }

        // Idempotency check
        String idempotencyKey = "dt_event:" + event.getEventId();
        if (redisService.get(idempotencyKey) != null || !processedEventIds.add(event.getEventId())) {
            log.info("Duplicate event detected, skipping: {}", event.getEventId());
            return;
        }
        redisService.put(idempotencyKey, "PROCESSED", 86400); // Cache for 24h

        String restaurantId = event.getRestaurantId();
        if (restaurantId == null) {
            log.warn("Event {} has no restaurantId, skipping.", event.getEventId());
            return;
        }

        log.info("Processing Digital Twin event: {} [Type: {}] for restaurant: {}", 
                event.getEventId(), event.getEventType(), restaurantId);

        // 1. Record event timestamp for sliding window demand counters
        String windowKey = "demand_window:" + restaurantId;
        redisService.recordEvent(windowKey, System.currentTimeMillis(), 3600000); // 1 Hour TTL

        // 2. Handle specific events to update sub-states
        handleSubStateUpdates(event);

        // 3. Re-calculate and publish the updated overall digital twin state
        updateAndBroadcastTwinState(restaurantId);
    }

    private void handleSubStateUpdates(DigitalTwinEventDto event) {
        String restaurantId = event.getRestaurantId();
        Map<String, Object> payload = event.getPayload();
        if (payload == null) return;

        switch (event.getEventType()) {
            case "ORDER_CREATED":
            case "ORDER_ACCEPTED":
                // Trigger inventory reserve based on Recipe BOM mapping
                if (payload.containsKey("items")) {
                    List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
                    for (Map<String, Object> item : items) {
                        String dishName = (String) item.get("name");
                        double qty = ((Number) item.getOrDefault("quantity", 1)).doubleValue();
                        reserveInventory(restaurantId, dishName, qty);
                    }
                }
                break;

            case "ORDER_COMPLETED":
                // Deduct reserved inventory, learn prep times
                if (payload.containsKey("items")) {
                    List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
                    for (Map<String, Object> item : items) {
                        String dishName = (String) item.get("name");
                        double qty = ((Number) item.getOrDefault("quantity", 1)).doubleValue();
                        consumeReservedInventory(restaurantId, dishName, qty);
                    }
                }
                // Learn prep time if duration details are present
                if (payload.containsKey("dishId") && payload.containsKey("actualPrepTimeMinutes")) {
                    String dishId = (String) payload.get("dishId");
                    double actualTime = ((Number) payload.get("actualPrepTimeMinutes")).doubleValue();
                    learnDishPreparationTime(dishId, actualTime);
                }
                break;

            case "KITCHEN_STARTED":
                // Increment station active load
                if (payload.containsKey("stationName")) {
                    String station = (String) payload.get("stationName");
                    updateKitchenStationLoad(restaurantId, station, 1);
                }
                break;

            case "KITCHEN_COMPLETED":
                // Decrement station active load
                if (payload.containsKey("stationName")) {
                    String station = (String) payload.get("stationName");
                    updateKitchenStationLoad(restaurantId, station, -1);
                }
                break;

            case "INVENTORY_UPDATED":
                // Directly update stock
                if (payload.containsKey("ingredientName") && payload.containsKey("quantity")) {
                    String ingredient = (String) payload.get("ingredientName");
                    double qty = ((Number) payload.get("quantity")).doubleValue();
                    updateInventoryStock(restaurantId, ingredient, qty);
                }
                break;

            case "STAFF_UPDATED":
                if (payload.containsKey("activeStaff")) {
                    int active = ((Number) payload.get("activeStaff")).intValue();
                    int total = ((Number) payload.getOrDefault("totalStaff", active)).intValue();
                    updateStaffCapacity(restaurantId, active, total);
                }
                break;

            default:
                break;
        }
    }

    /**
     * Learning Dish preparation times. Continually updates learned averages using historical values.
     */
    public void learnDishPreparationTime(String dishId, double actualMinutes) {
        learnedPrepTimes.compute(dishId, (id, oldVal) -> {
            if (oldVal == null) {
                return actualMinutes;
            }
            // Simple exponential moving average for learned prep time
            return (0.8 * oldVal) + (0.2 * actualMinutes);
        });
    }

    public double getEstimatedPrepTime(String dishId, String dishName) {
        if (learnedPrepTimes.containsKey(dishId)) {
            return learnedPrepTimes.get(dishId);
        }
        // Base defaults based on dish type
        String lower = dishName.toLowerCase();
        if (lower.contains("biryani")) return 23.0;
        if (lower.contains("pizza")) return 20.0;
        if (lower.contains("burger")) return 14.0;
        return 15.0;
    }

    /**
     * Recipe Book of Materials (BOM) mapping.
     */
    public Map<String, Double> getDishRecipe(String dishName) {
        Map<String, Double> recipe = new HashMap<>();
        String normalized = dishName.toLowerCase();
        if (normalized.contains("biryani")) {
            recipe.put("Chicken", 0.25);
            recipe.put("Rice", 0.30);
            recipe.put("Spices", 0.05);
        } else if (normalized.contains("burger") || normalized.contains("bistro")) {
            recipe.put("Patty", 1.0);
            recipe.put("Bun", 1.0);
            recipe.put("Cheese", 0.05);
        } else if (normalized.contains("pizza") || normalized.contains("piazza")) {
            recipe.put("Cheese", 0.15);
            recipe.put("Dough", 0.20);
            recipe.put("Sauce", 0.08);
        } else if (normalized.contains("pasta") || normalized.contains("carbonara")) {
            recipe.put("Pasta", 0.15);
            recipe.put("Sauce", 0.10);
            recipe.put("Cheese", 0.03);
        } else if (normalized.contains("sushi") || normalized.contains("salmon")) {
            recipe.put("Salmon", 0.15);
            recipe.put("Rice", 0.20);
        } else {
            recipe.put("General Ingredients", 0.10);
        }
        return recipe;
    }

    private void reserveInventory(String restaurantId, String dishName, double quantity) {
        Map<String, Double> recipe = getDishRecipe(dishName);
        for (Map.Entry<String, Double> ingredient : recipe.entrySet()) {
            double reqAmount = ingredient.getValue() * quantity;
            RestaurantInventoryMetric metric = getOrCreateInventoryMetric(restaurantId, ingredient.getKey());
            metric.setReservedQuantity(metric.getReservedQuantity() + reqAmount);
            metric.setAvailableQuantity(Math.max(0.0, metric.getCurrentQuantity() - metric.getReservedQuantity()));
            metric.setTimestamp(LocalDateTime.now());
            inventoryMetricRepository.save(metric);
        }
    }

    private void consumeReservedInventory(String restaurantId, String dishName, double quantity) {
        Map<String, Double> recipe = getDishRecipe(dishName);
        for (Map.Entry<String, Double> ingredient : recipe.entrySet()) {
            double reqAmount = ingredient.getValue() * quantity;
            RestaurantInventoryMetric metric = getOrCreateInventoryMetric(restaurantId, ingredient.getKey());
            metric.setReservedQuantity(Math.max(0.0, metric.getReservedQuantity() - reqAmount));
            metric.setCurrentQuantity(Math.max(0.0, metric.getCurrentQuantity() - reqAmount));
            metric.setAvailableQuantity(Math.max(0.0, metric.getCurrentQuantity() - metric.getReservedQuantity()));
            metric.setTimestamp(LocalDateTime.now());
            inventoryMetricRepository.save(metric);
        }
    }

    private void updateInventoryStock(String restaurantId, String ingredientName, double quantity) {
        RestaurantInventoryMetric metric = getOrCreateInventoryMetric(restaurantId, ingredientName);
        metric.setCurrentQuantity(quantity);
        metric.setAvailableQuantity(Math.max(0.0, quantity - metric.getReservedQuantity()));
        metric.setTimestamp(LocalDateTime.now());
        inventoryMetricRepository.save(metric);
    }

    private RestaurantInventoryMetric getOrCreateInventoryMetric(String restaurantId, String ingredientName) {
        List<RestaurantInventoryMetric> list = inventoryMetricRepository
                .findByRestaurantIdAndIngredientNameOrderByTimestampDesc(restaurantId, ingredientName);
        if (!list.isEmpty()) {
            return list.get(0);
        }
        // Initialize base defaults
        double initialQty = 100.0;
        if ("Chicken".equalsIgnoreCase(ingredientName)) initialQty = 50.0;
        if ("Salmon".equalsIgnoreCase(ingredientName)) initialQty = 30.0;

        return RestaurantInventoryMetric.builder()
                .restaurantId(restaurantId)
                .ingredientName(ingredientName)
                .currentQuantity(initialQty)
                .reservedQuantity(0.0)
                .availableQuantity(initialQty)
                .unit("Chicken".equalsIgnoreCase(ingredientName) || "Salmon".equalsIgnoreCase(ingredientName) ? "KG" : "PCS")
                .reorderThreshold(10.0)
                .averageConsumptionRate(2.0)
                .predictedConsumptionRate(2.0)
                .estimatedStockoutMinutes(1440)
                .supplierInfo("FoodIQ Direct Supply")
                .timestamp(LocalDateTime.now())
                .build();
    }

    private void updateKitchenStationLoad(String restaurantId, String stationName, int change) {
        List<RestaurantKitchenMetric> list = kitchenMetricRepository
                .findByRestaurantIdAndStationNameOrderByTimestampDesc(restaurantId, stationName);
        RestaurantKitchenMetric metric;
        if (!list.isEmpty()) {
            metric = list.get(0);
        } else {
            metric = RestaurantKitchenMetric.builder()
                    .restaurantId(restaurantId)
                    .stationName(stationName)
                    .capacity(10)
                    .activeOrders(0)
                    .utilization(0.0)
                    .timestamp(LocalDateTime.now())
                    .build();
        }
        metric.setActiveOrders(Math.max(0, metric.getActiveOrders() + change));
        metric.setUtilization((double) metric.getActiveOrders() / metric.getCapacity());
        metric.setTimestamp(LocalDateTime.now());
        kitchenMetricRepository.save(metric);
    }

    private void updateStaffCapacity(String restaurantId, int active, int total) {
        RestaurantStaffMetric metric = RestaurantStaffMetric.builder()
                .restaurantId(restaurantId)
                .activeStaff(active)
                .totalStaff(total)
                .averageProductivity(5.0) // 5 orders/hour productivity default
                .timestamp(LocalDateTime.now())
                .build();
        staffMetricRepository.save(metric);
    }

    /**
     * Compute demand metrics using sliding windows.
     */
    public Map<String, Long> calculateSlidingDemand(String restaurantId) {
        Map<String, Long> demand = new HashMap<>();
        String windowKey = "demand_window:" + restaurantId;
        
        demand.put("last1Minute", redisService.getEventCount(windowKey, 60000));
        demand.put("last5Minutes", redisService.getEventCount(windowKey, 300000));
        demand.put("last15Minutes", redisService.getEventCount(windowKey, 900000));
        demand.put("last30Minutes", redisService.getEventCount(windowKey, 1800000));
        demand.put("last60Minutes", redisService.getEventCount(windowKey, 3600000));

        return demand;
    }

    /**
     * Re-calculate forecast, risks, anomalies, health score, save states, and broadcast.
     */
    public void updateAndBroadcastTwinState(String restaurantId) {
        RestaurantDigitalTwinState twinState = twinStateRepository.findByRestaurantId(restaurantId)
                .orElseGet(() -> RestaurantDigitalTwinState.builder()
                        .restaurantId(restaurantId)
                        .status("OPEN")
                        .activeOrders(0)
                        .ordersLast15Minutes(0)
                        .averagePreparationTime(15.0)
                        .kitchenUtilization(0.0)
                        .staffUtilization(0.0)
                        .inventoryRisk("LOW")
                        .slaRisk(0.0)
                        .healthScore(100)
                        .lastUpdated(LocalDateTime.now())
                        .build());

        // Get live order count
        List<Order> activeOrdersList = orderRepository.findByRestaurantIdAndCreatedDateAfter(
                restaurantId, LocalDateTime.now().minusHours(2)
        );
        int activeCount = (int) activeOrdersList.stream()
                .filter(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.CANCELLED)
                .count();
        twinState.setActiveOrders(activeCount);

        // Fetch sliding demand counters
        Map<String, Long> slidingDemand = calculateSlidingDemand(restaurantId);
        twinState.setOrdersLast15Minutes(slidingDemand.get("last15Minutes").intValue());

        // Get latest kitchen metrics
        List<RestaurantKitchenMetric> stations = kitchenMetricRepository.findByRestaurantId(restaurantId);
        double avgKitchenUtil = 0.0;
        if (!stations.isEmpty()) {
            avgKitchenUtil = stations.stream().mapToDouble(RestaurantKitchenMetric::getUtilization).average().orElse(0.0);
        }
        twinState.setKitchenUtilization(avgKitchenUtil);

        // Calculate staff utilization
        List<RestaurantStaffMetric> staff = staffMetricRepository.findByRestaurantId(restaurantId);
        int activeStaffCount = 5;
        if (!staff.isEmpty()) {
            activeStaffCount = staff.get(0).getActiveStaff();
        }
        double staffUtil = activeCount > 0 ? Math.min(1.0, (double) activeCount / (activeStaffCount * 3)) : 0.0;
        twinState.setStaffUtilization(staffUtil);

        // Run forecast model
        Map<String, Object> forecastContext = new HashMap<>();
        forecastContext.put("recentTrend", 1.05); // Simulated +5% trend
        forecastContext.put("weather", "CLEAR"); // Default clear weather
        
        // Fetch historical hourly demand rates
        List<Integer> history = new ArrayList<>(List.of(12, 15, 18, 14, 16, 20)); // Seeded baseline
        
        DemandForecastModel forecastModel = forecastModels.stream()
                .filter(m -> m instanceof BaselineForecastModel)
                .findFirst()
                .orElse(forecastModels.get(0));

        RestaurantForecast forecast30 = forecastModel.generateForecast(restaurantId, "NEXT_30_MINUTES", history, forecastContext);
        RestaurantForecast forecast60 = forecastModel.generateForecast(restaurantId, "NEXT_60_MINUTES", history, forecastContext);
        
        forecastRepository.save(forecast30);
        forecastRepository.save(forecast60);

        twinState.setPredictedOrdersNext30Minutes(forecast30.getPredictedOrders());
        twinState.setPredictedOrdersNext60Minutes(forecast60.getPredictedOrders());

        // Evaluate Inventory Risk & depletion
        List<RestaurantInventoryMetric> inventory = inventoryMetricRepository.findByRestaurantId(restaurantId);
        String worstRisk = "LOW";
        for (RestaurantInventoryMetric inv : inventory) {
            // Predict Stockout ETA
            double depletionRate = inv.getPredictedConsumptionRate() > 0 ? inv.getPredictedConsumptionRate() : 1.0;
            double hoursLeft = inv.getAvailableQuantity() / depletionRate;
            int minutesLeft = (int) Math.round(hoursLeft * 60);
            inv.setEstimatedStockoutMinutes(minutesLeft);
            inventoryMetricRepository.save(inv);

            if (minutesLeft < 60) {
                worstRisk = "CRITICAL";
                triggerInventoryRisk(restaurantId, inv.getIngredientName(), minutesLeft);
            } else if (minutesLeft < 180 && !"CRITICAL".equals(worstRisk)) {
                worstRisk = "HIGH";
            } else if (minutesLeft < 480 && !"CRITICAL".equals(worstRisk) && !"HIGH".equals(worstRisk)) {
                worstRisk = "MEDIUM";
            }
        }
        twinState.setInventoryRisk(worstRisk);

        // Calculate SLA Risk & Bottlenecks
        double slaRisk = 0.0;
        if (avgKitchenUtil > 0.90) {
            slaRisk += 0.40;
            triggerKitchenBottleneck(restaurantId, avgKitchenUtil);
        }
        if (staffUtil > 0.95) {
            slaRisk += 0.30;
        }
        twinState.setSlaRisk(Math.min(1.0, slaRisk));

        // Evaluate Anomaly Detection
        detectDemandAnomalies(restaurantId, slidingDemand.get("last60Minutes").intValue());

        // Calculate explainable Health Score (0-100)
        int health = 100;
        if ("CRITICAL".equalsIgnoreCase(worstRisk)) health -= 25;
        if ("HIGH".equalsIgnoreCase(worstRisk)) health -= 15;
        if (avgKitchenUtil > 0.90) health -= 20;
        if (slaRisk > 0.50) health -= 15;
        if (staffUtil > 0.95) health -= 10;
        twinState.setHealthScore(Math.max(10, health));

        twinState.setLastUpdated(LocalDateTime.now());
        twinStateRepository.save(twinState);

        // Cache state in Redis
        try {
            redisService.put("dt_state:" + restaurantId, objectMapper.writeValueAsString(twinState), 300);
        } catch (Exception e) {
            log.warn("Failed to serialize and cache twin state: {}", e.getMessage());
        }

        // Generate autonomous recommendations
        generateAutonomousRecommendations(restaurantId, twinState, worstRisk, avgKitchenUtil);

        // Broadcast to WebSocket clients
        broadcastWebSocketUpdate(restaurantId, twinState);
    }

    private void triggerInventoryRisk(String restaurantId, String ingredient, int minutesLeft) {
        RestaurantRiskEvent risk = RestaurantRiskEvent.builder()
                .restaurantId(restaurantId)
                .riskType("INVENTORY_STOCKOUT_RISK")
                .severity("CRITICAL")
                .detectedAt(LocalDateTime.now())
                .reason(String.format("%s inventory is extremely low. Depletion expected in %d minutes.", ingredient, minutesLeft))
                .affectedArea("INVENTORY")
                .recommendedAction("Reorder ingredient immediately from supplier.")
                .status("ACTIVE")
                .build();
        riskEventRepository.save(risk);
    }

    private void triggerKitchenBottleneck(String restaurantId, double util) {
        RestaurantRiskEvent risk = RestaurantRiskEvent.builder()
                .restaurantId(restaurantId)
                .riskType("KITCHEN_BOTTLENECK")
                .severity("HIGH")
                .detectedAt(LocalDateTime.now())
                .reason(String.format("Kitchen capacity utilization is at %.0f%%. Order backlog building up.", util * 100))
                .affectedArea("KITCHEN")
                .recommendedAction("Distribute tasks to packing station or temporarily restrict incoming promo deals.")
                .status("ACTIVE")
                .build();
        riskEventRepository.save(risk);
    }

    private void detectDemandAnomalies(String restaurantId, int ordersLastHour) {
        // Simple heuristic: Expected Friday/Saturday baseline is 30 orders/hour. If we see <5 orders/hour, trigger demand drop anomaly.
        int expectedBaseline = 25;
        if (ordersLastHour < 5) {
            RestaurantAnomaly anomaly = RestaurantAnomaly.builder()
                    .restaurantId(restaurantId)
                    .anomalyType("DEMAND_DROP_ANOMALY")
                    .description("Orders in the last hour are significantly below historical baseline.")
                    .metricName("ordersPerHour")
                    .expectedValue((double) expectedBaseline)
                    .actualValue((double) ordersLastHour)
                    .detectedAt(LocalDateTime.now())
                    .potentialCauses("1. Restaurant menu offline in app. 2. Internet connectivity issues at location. 3. Active competitor discount campaigns.")
                    .build();
            anomalyRepository.save(anomaly);
        }
    }

    private void generateAutonomousRecommendations(String restaurantId, RestaurantDigitalTwinState state, String invRisk, double kitchenUtil) {
        if ("CRITICAL".equalsIgnoreCase(invRisk)) {
            RestaurantOperationalRecommendation rec = RestaurantOperationalRecommendation.builder()
                    .restaurantId(restaurantId)
                    .action("RESTOCK_INGREDIENT")
                    .reason("Stock depletion expected within 60 minutes.")
                    .expectedImpact("Avoid order cancellations and menu item disabling.")
                    .confidence(0.95)
                    .requiredAction("Approve auto-reorder request.")
                    .timestamp(LocalDateTime.now())
                    .status("RECOMMENDED")
                    .build();
            recommendationRepository.save(rec);
        }

        if (kitchenUtil > 0.90) {
            RestaurantOperationalRecommendation rec = RestaurantOperationalRecommendation.builder()
                    .restaurantId(restaurantId)
                    .action("INCREASE_STAFFING")
                    .reason("Kitchen utilization exceeds 90%. Bottlenecks building up.")
                    .expectedImpact("Reduce average preparation delays by 4-6 minutes.")
                    .confidence(0.85)
                    .requiredAction("Deploy 1 extra staff to Fry/Grill station.")
                    .timestamp(LocalDateTime.now())
                    .status("RECOMMENDED")
                    .build();
            recommendationRepository.save(rec);
        }
    }

    private void broadcastWebSocketUpdate(String restaurantId, RestaurantDigitalTwinState state) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("restaurantId", restaurantId);
            message.put("timestamp", LocalDateTime.now().toString());
            message.put("state", state);
            messagingTemplate.convertAndSend("/topic/digital-twin/" + restaurantId, message);
            messagingTemplate.convertAndSend("/topic/digital-twin/updates", message);
            log.info("Successfully published digital twin WebSocket update for restaurant: {}", restaurantId);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket update for twin state: {}", e.getMessage());
        }
    }

    /**
     * Run What-If operational simulations virtual scenario runs.
     * Does NOT mutate real production state.
     */
    public RestaurantSimulation runSimulation(String restaurantId, double orderIncrease, int staffChange, double discountApplied) {
        // Fetch current active state
        RestaurantDigitalTwinState currentState = twinStateRepository.findByRestaurantId(restaurantId)
                .orElse(RestaurantDigitalTwinState.builder()
                        .activeOrders(5)
                        .kitchenUtilization(0.40)
                        .slaRisk(0.0)
                        .build());

        // Perform what-if calculations
        int simulatedActiveOrders = (int) Math.round(currentState.getActiveOrders() * (1.0 + orderIncrease));
        double simulatedKitchenUtil = Math.min(1.0, currentState.getKitchenUtilization() * (1.0 + orderIncrease) * (staffChange < 0 ? 1.20 : (staffChange > 0 ? 0.85 : 1.0)));
        
        String inventoryRisk = "LOW";
        if (orderIncrease > 0.40) {
            inventoryRisk = "HIGH";
        }

        double slaRisk = simulatedKitchenUtil > 0.90 ? 0.35 : 0.05;
        if (staffChange < 0) {
            slaRisk += 0.20;
        }

        Map<String, Object> results = new HashMap<>();
        results.put("predictedOrders", simulatedActiveOrders);
        results.put("kitchenUtilization", simulatedKitchenUtil);
        results.put("inventoryRisk", inventoryRisk);
        results.put("slaRisk", slaRisk);

        List<Map<String, String>> recommendations = new ArrayList<>();
        if (simulatedKitchenUtil > 0.90) {
            Map<String, String> rec = new HashMap<>();
            rec.put("action", "INCREASE_STAFF");
            rec.put("reason", "Kitchen capacity utilization predicted to hit " + Math.round(simulatedKitchenUtil * 100) + "%.");
            rec.put("expectedImpact", "Reduce SLA/preparation delay risk.");
            recommendations.add(rec);
        }

        results.put("recommendations", recommendations);

        String resultsJson = "{}";
        try {
            resultsJson = objectMapper.writeValueAsString(results);
        } catch (Exception e) {
            log.error("Serialization failed for simulation results: {}", e.getMessage());
        }

        RestaurantSimulation simulation = RestaurantSimulation.builder()
                .restaurantId(restaurantId)
                .orderIncrease(orderIncrease)
                .staffChange(staffChange)
                .discountApplied(discountApplied)
                .resultsJson(resultsJson)
                .createdAt(LocalDateTime.now())
                .build();

        return simulationRepository.save(simulation);
    }
}
