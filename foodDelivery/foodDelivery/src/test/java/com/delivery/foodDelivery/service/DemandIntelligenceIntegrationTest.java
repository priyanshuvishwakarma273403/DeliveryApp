package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DemandIntelligenceIntegrationTest {

    @Autowired
    private DemandIntelligenceService demandIntelligenceService;

    @MockBean
    private RestaurantDigitalTwinStateRepository twinStateRepository;

    @MockBean
    private DishDemandForecastRepository dishDemandForecastRepository;

    @MockBean
    private RestaurantPrepPlanRepository prepPlanRepository;

    @MockBean
    private RestaurantKitchenMetricRepository kitchenMetricRepository;

    @MockBean
    private RestaurantInventoryMetricRepository inventoryMetricRepository;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private MenuItemRepository menuItemRepository;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    private String restaurantId = "rest-test-123";

    @BeforeEach
    public void setUp() {
        // Mock twin state
        RestaurantDigitalTwinState mockState = new RestaurantDigitalTwinState();
        mockState.setRestaurantId(restaurantId);
        mockState.setActiveOrders(10);
        mockState.setOrdersLast15Minutes(5);
        mockState.setKitchenUtilization(0.65);
        mockState.setStaffUtilization(0.70);
        mockState.setHealthScore(95);
        mockState.setSlaRisk(0.12);
        mockState.setInventoryRisk("LOW");
        mockState.setLastUpdated(LocalDateTime.now());
        
        Mockito.when(twinStateRepository.findByRestaurantId(restaurantId))
                .thenReturn(Optional.of(mockState));

        // Mock menu items
        MenuItem dish1 = new MenuItem();
        dish1.setId(101L);
        dish1.setName("Special Biryani");
        dish1.setPrice(350.0);

        MenuItem dish2 = new MenuItem();
        dish2.setId(102L);
        dish2.setName("Garlic Naan");
        dish2.setPrice(60.0);

        Mockito.when(menuItemRepository.findAll())
                .thenReturn(List.of(dish1, dish2));

        // Mock kitchen metrics
        RestaurantKitchenMetric kitchenMetric1 = new RestaurantKitchenMetric();
        kitchenMetric1.setRestaurantId(restaurantId);
        kitchenMetric1.setStationName("Grill");
        kitchenMetric1.setCurrentUtilization(0.75);
        kitchenMetric1.setQueueSize(3);
        kitchenMetric1.setEstimatedDelayMinutes(4.5);

        RestaurantKitchenMetric kitchenMetric2 = new RestaurantKitchenMetric();
        kitchenMetric2.setRestaurantId(restaurantId);
        kitchenMetric2.setStationName("Fryer");
        kitchenMetric2.setCurrentUtilization(0.40);
        kitchenMetric2.setQueueSize(1);
        kitchenMetric2.setEstimatedDelayMinutes(1.0);

        Mockito.when(kitchenMetricRepository.findByRestaurantId(restaurantId))
                .thenReturn(List.of(kitchenMetric1, kitchenMetric2));

        // Mock inventory metrics
        RestaurantInventoryMetric inventoryMetric1 = new RestaurantInventoryMetric();
        inventoryMetric1.setRestaurantId(restaurantId);
        inventoryMetric1.setIngredientName("Rice");
        inventoryMetric1.setCurrentStock(50.0);
        inventoryMetric1.setSafetyStock(10.0);
        inventoryMetric1.setDailyConsumptionRate(30.0);
        inventoryMetric1.setUnit("KG");

        RestaurantInventoryMetric inventoryMetric2 = new RestaurantInventoryMetric();
        inventoryMetric2.setRestaurantId(restaurantId);
        inventoryMetric2.setIngredientName("Chicken");
        inventoryMetric2.setCurrentStock(4.0);
        inventoryMetric2.setSafetyStock(5.0);
        inventoryMetric2.setDailyConsumptionRate(15.0);
        inventoryMetric2.setUnit("KG");

        Mockito.when(inventoryMetricRepository.findByRestaurantId(restaurantId))
                .thenReturn(List.of(inventoryMetric1, inventoryMetric2));
    }

    @Test
    public void testGenerateMultiHorizonForecasts() {
        List<RestaurantForecast> forecasts = demandIntelligenceService.generateMultiHorizonForecasts(restaurantId);
        assertNotNull(forecasts);
        assertFalse(forecasts.isEmpty());
        // Verify we got the horizons populated
        assertTrue(forecasts.stream().anyMatch(f -> f.getHorizon() == RestaurantForecast.ForecastHorizon.NEXT_15_MINUTES));
        assertTrue(forecasts.stream().anyMatch(f -> f.getHorizon() == RestaurantForecast.ForecastHorizon.NEXT_7_DAYS));
    }

    @Test
    public void testPredictKitchenCapacity() {
        Map<String, Object> capacityDetails = demandIntelligenceService.predictKitchenCapacity(restaurantId);
        assertNotNull(capacityDetails);
        assertTrue(capacityDetails.containsKey("stations"));
        assertTrue(capacityDetails.containsKey("predictedBottleneck"));
        
        List<Map<String, Object>> stations = (List<Map<String, Object>>) capacityDetails.get("stations");
        assertFalse(stations.isEmpty());
        assertTrue(stations.stream().anyMatch(st -> st.get("station").equals("Grill")));
    }

    @Test
    public void testRunWhatIfSimulation() {
        Map<String, Object> simResults = demandIntelligenceService.runWhatIfSimulation(restaurantId, 0.40, -1, 0.0);
        assertNotNull(simResults);
        assertEquals(14, simResults.get("predictedOrders"));
        assertTrue((Double) simResults.get("capacityUtilization") > 0.65);
    }
}
