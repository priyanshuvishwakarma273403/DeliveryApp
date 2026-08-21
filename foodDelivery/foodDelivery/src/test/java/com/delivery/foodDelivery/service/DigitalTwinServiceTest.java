package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.DigitalTwinEventDto;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.service.forecast.DemandForecastModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DigitalTwinServiceTest {

    @Autowired
    private DigitalTwinService digitalTwinService;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private MenuItemRepository menuItemRepository;

    @MockBean
    private RestaurantDigitalTwinStateRepository twinStateRepository;

    @MockBean
    private RestaurantKitchenMetricRepository kitchenMetricRepository;

    @MockBean
    private RestaurantInventoryMetricRepository inventoryMetricRepository;

    @MockBean
    private RestaurantStaffMetricRepository staffMetricRepository;

    @MockBean
    private RestaurantForecastRepository forecastRepository;

    @MockBean
    private RestaurantRiskEventRepository riskEventRepository;

    @MockBean
    private RestaurantAnomalyRepository anomalyRepository;

    @MockBean
    private RestaurantSimulationRepository simulationRepository;

    @MockBean
    private RestaurantOperationalRecommendationRepository recommendationRepository;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    @BeforeEach
    public void setup() {
        Mockito.when(orderRepository.findByRestaurantIdAndCreatedDateAfter(Mockito.anyString(), Mockito.any()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    public void testProcessOrderCreatedEvent() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("items", List.of(Map.of("name", "Paneer Tikka Biryani", "quantity", 2)));

        DigitalTwinEventDto event = DigitalTwinEventDto.builder()
                .eventId("evt-001")
                .eventType("ORDER_CREATED")
                .schemaVersion(1)
                .timestamp(LocalDateTime.now().toString())
                .restaurantId("rest-789")
                .correlationId("corr-111")
                .source("ordering-service")
                .payload(payload)
                .build();

        // Process the event
        digitalTwinService.processEvent(event);

        // Verify inventory metric was queried and saved (due to recipe ingredients reserve)
        Mockito.verify(inventoryMetricRepository, Mockito.atLeastOnce()).save(Mockito.any(RestaurantInventoryMetric.class));
        
        // Verify twin state was updated and saved
        Mockito.verify(twinStateRepository, Mockito.atLeastOnce()).save(Mockito.any(RestaurantDigitalTwinState.class));
        
        // Verify WebSockets published updates
        Mockito.verify(messagingTemplate, Mockito.atLeastOnce()).convertAndSend(
                Mockito.contains("/topic/digital-twin/"), Mockito.any(Map.class)
        );
    }

    @Test
    public void testIdempotency() {
        DigitalTwinEventDto event = DigitalTwinEventDto.builder()
                .eventId("evt-unique-id-999")
                .eventType("STAFF_UPDATED")
                .restaurantId("rest-789")
                .payload(Map.of("activeStaff", 6))
                .build();

        // Process first time
        digitalTwinService.processEvent(event);
        
        // Process second time (should be ignored due to idempotency)
        Mockito.clearInvocations(twinStateRepository);
        digitalTwinService.processEvent(event);

        Mockito.verify(twinStateRepository, Mockito.never()).save(Mockito.any(RestaurantDigitalTwinState.class));
    }

    @Test
    public void testWhatIfSimulation() {
        Mockito.when(twinStateRepository.findByRestaurantId("rest-789"))
                .thenReturn(Optional.of(RestaurantDigitalTwinState.builder()
                        .restaurantId("rest-789")
                        .activeOrders(10)
                        .kitchenUtilization(0.50)
                        .healthScore(80)
                        .build()));

        RestaurantSimulation sim = RestaurantSimulation.builder()
                .restaurantId("rest-789")
                .orderIncrease(0.40)
                .staffChange(2)
                .build();

        Mockito.when(simulationRepository.save(Mockito.any(RestaurantSimulation.class))).thenReturn(sim);

        RestaurantSimulation result = digitalTwinService.runSimulation("rest-789", 0.40, 2, 0.0);
        assertNotNull(result);
        assertEquals("rest-789", result.getRestaurantId());
        assertEquals(0.40, result.getOrderIncrease());
    }
}
