package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.DigitalTwinService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RestaurantDigitalTwinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RestaurantDigitalTwinStateRepository twinStateRepository;

    @MockBean
    private RestaurantForecastRepository forecastRepository;

    @MockBean
    private RestaurantKitchenMetricRepository kitchenMetricRepository;

    @MockBean
    private RestaurantInventoryMetricRepository inventoryMetricRepository;

    @MockBean
    private RestaurantRiskEventRepository riskEventRepository;

    @MockBean
    private RestaurantAnomalyRepository anomalyRepository;

    @MockBean
    private RestaurantSimulationRepository simulationRepository;

    @MockBean
    private RestaurantOperationalRecommendationRepository recommendationRepository;

    @MockBean
    private DigitalTwinService digitalTwinService;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    private User mockPartnerUser;
    private RestaurantDigitalTwinState mockState;

    @BeforeEach
    public void setup() {
        mockPartnerUser = User.builder()
                .id(456L)
                .email("partner@foodiq.com")
                .name("Partner Owner")
                .role(Role.PARTNER)
                .build();

        mockState = RestaurantDigitalTwinState.builder()
                .id(1L)
                .restaurantId("rest-123")
                .status("OPEN")
                .activeOrders(4)
                .ordersLast15Minutes(5)
                .averagePreparationTime(18.5)
                .kitchenUtilization(0.65)
                .staffUtilization(0.70)
                .inventoryRisk("LOW")
                .slaRisk(0.12)
                .predictedOrdersNext30Minutes(6)
                .predictedOrdersNext60Minutes(12)
                .healthScore(95)
                .lastUpdated(LocalDateTime.now())
                .build();

        Mockito.when(userRepository.findByEmail("partner@foodiq.com")).thenReturn(Optional.of(mockPartnerUser));
    }

    @Test
    @WithMockUser(username = "partner@foodiq.com", roles = {"PARTNER"})
    public void testGetDigitalTwin() throws Exception {
        Mockito.when(twinStateRepository.findByRestaurantId("rest-123")).thenReturn(Optional.of(mockState));

        mockMvc.perform(get("/v1/restaurants/rest-123/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").value("rest-123"))
                .andExpect(jsonPath("$.healthScore").value(95))
                .andExpect(jsonPath("$.activeOrders").value(4));
    }

    @Test
    @WithMockUser(username = "partner@foodiq.com", roles = {"PARTNER"})
    public void testGetForecast() throws Exception {
        RestaurantForecast forecast = RestaurantForecast.builder()
                .restaurantId("rest-123")
                .horizon("NEXT_30_MINUTES")
                .predictedOrders(10)
                .confidence(0.85)
                .trend("INCREASING")
                .generatedAt(LocalDateTime.now())
                .build();

        Mockito.when(forecastRepository.findByRestaurantId("rest-123")).thenReturn(List.of(forecast));

        mockMvc.perform(get("/v1/restaurants/rest-123/forecast"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].horizon").value("NEXT_30_MINUTES"))
                .andExpect(jsonPath("$[0].predictedOrders").value(10))
                .andExpect(jsonPath("$[0].trend").value("INCREASING"));
    }

    @Test
    @WithMockUser(username = "partner@foodiq.com", roles = {"PARTNER"})
    public void testGetHealth() throws Exception {
        Mockito.when(twinStateRepository.findByRestaurantId("rest-123")).thenReturn(Optional.of(mockState));

        mockMvc.perform(get("/v1/restaurants/rest-123/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore").value(95))
                .andExpect(jsonPath("$.slaRisk").value(0.12));
    }

    @Test
    @WithMockUser(username = "partner@foodiq.com", roles = {"PARTNER"})
    public void testSimulateScenario() throws Exception {
        RestaurantSimulation mockSimulation = RestaurantSimulation.builder()
                .id(1L)
                .restaurantId("rest-123")
                .orderIncrease(0.30)
                .staffChange(-1)
                .discountApplied(0.20)
                .resultsJson("{\"predictedOrders\": 10}")
                .createdAt(LocalDateTime.now())
                .build();

        Mockito.when(digitalTwinService.runSimulation(
                Mockito.eq("rest-123"), Mockito.eq(0.30), Mockito.eq(-1), Mockito.eq(0.20)
        )).thenReturn(mockSimulation);

        RestaurantDigitalTwinController.SimulationRequest req = new RestaurantDigitalTwinController.SimulationRequest();
        req.setOrderIncrease(0.30);
        req.setStaffChange(-1);
        req.setDiscountApplied(0.20);

        mockMvc.perform(post("/v1/restaurants/rest-123/simulate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderIncrease").value(0.30))
                .andExpect(jsonPath("$.staffChange").value(-1))
                .andExpect(jsonPath("$.discountApplied").value(0.20));
    }
}
