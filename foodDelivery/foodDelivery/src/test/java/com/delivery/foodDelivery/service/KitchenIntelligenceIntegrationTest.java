package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.KitchenState;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.repository.jpa.*;
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
public class KitchenIntelligenceIntegrationTest {

    @Autowired
    private KitchenStateMachine stateMachine;

    @Autowired
    private KitchenPriorityEngine priorityEngine;

    @Autowired
    private RiderKitchenSyncEngine riderSyncEngine;

    @MockBean
    private KitchenStationRepository stationRepository;

    @MockBean
    private KitchenTaskRepository taskRepository;

    @MockBean
    private KitchenTaskDependencyRepository dependencyRepository;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private DishPreparationProfileRepository profileRepository;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    @Test
    public void testKitchenStateMachineTransitions() {
        // Valid transition: OPEN -> PREPARING
        assertTrue(stateMachine.isTransitionAllowed(KitchenState.OPEN, KitchenState.PREPARING));
        
        // Valid transition: PREPARING -> BUSY
        assertTrue(stateMachine.isTransitionAllowed(KitchenState.PREPARING, KitchenState.BUSY));

        // Invalid transition: CLOSED -> PREPARING (must open first)
        assertFalse(stateMachine.isTransitionAllowed(KitchenState.CLOSED, KitchenState.PREPARING));

        // Valid transition: BUSY -> MAINTENANCE
        assertTrue(stateMachine.isTransitionAllowed(KitchenState.BUSY, KitchenState.MAINTENANCE));
    }

    @Test
    public void testKitchenPriorityEngine() {
        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.KITCHEN_PREPARING)
                .totalAmount(450.0)
                .build();
        order.setCreatedDate(LocalDateTime.now().minusMinutes(12)); // 12 minutes old

        DishPreparationProfile profile = DishPreparationProfile.builder()
                .dishId("dish-abc")
                .estimatedPrepTime(15.0)
                .priority(2)
                .freshnessWindow(30)
                .build();

        // High load case
        double priorityScoreHighLoad = priorityEngine.calculatePriority(order, 5.0, 0.9, profile);
        
        // Low load case
        double priorityScoreLowLoad = priorityEngine.calculatePriority(order, 5.0, 0.2, profile);

        // Lower load should result in higher priority (less bottleneck) or vice versa depending on priority algorithm
        assertNotEquals(priorityScoreHighLoad, priorityScoreLowLoad);
        assertTrue(priorityScoreHighLoad > 0.0);
    }

    @Test
    public void testRiderKitchenSyncJitDispatch() {
        // Prep time remaining = 10 mins, Rider ETA = 12 mins -> Dispatch immediately (recommend true)
        assertTrue(riderSyncEngine.recommendRiderDispatch(10.0, 12.0));

        // Prep time remaining = 15 mins, Rider ETA = 5 mins -> Hold dispatch (recommend false)
        assertFalse(riderSyncEngine.recommendRiderDispatch(15.0, 5.0));
    }
}
