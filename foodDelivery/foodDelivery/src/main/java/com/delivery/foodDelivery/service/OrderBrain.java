package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderBrain {

    private final OrderRepository orderRepository;
    private final OrderDigitalTwinRepository twinRepository;
    private final OrderRiskRepository riskRepository;
    private final OrderRecoveryActionRepository recoveryActionRepository;
    private final OrderOperationalTimelineRepository timelineRepository;
    private final OrderHealthSnapshotRepository healthSnapshotRepository;
    
    private final OrderHealthEngine healthEngine;
    private final OrderRiskEngine riskEngine;
    private final OrderRecoveryEngine recoveryEngine;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public OrderDigitalTwin updateAndProcessOrder(Long orderId) {
        log.info("OrderBrain processing orderId={}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // 1. Get or create Digital Twin
        OrderDigitalTwin twin = twinRepository.findByOrderId(orderId)
                .orElseGet(() -> OrderDigitalTwin.builder()
                        .orderId(orderId)
                        .restaurantStatus("PENDING")
                        .kitchenProgress(0.0)
                        .predictedFoodReadyAt(LocalDateTime.now().plusMinutes(15))
                        .riderStatus("UNASSIGNED")
                        .predictedPickupAt(LocalDateTime.now().plusMinutes(18))
                        .predictedDeliveryAt(LocalDateTime.now().plusMinutes(35))
                        .slaRisk("NONE")
                        .delayRisk("NONE")
                        .inventoryRisk("NONE")
                        .overallHealth("HEALTHY")
                        .timestamp(LocalDateTime.now())
                        .build());

        // Update basic attributes from order status
        twin.setRestaurantStatus(order.getStatus().name());
        if (order.getStatus() == OrderStatus.DELIVERED) {
            twin.setRiderStatus("DELIVERED");
        } else if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == OrderStatus.PICKED_UP) {
            twin.setRiderStatus("PICKED_UP");
        }

        // 2. Evaluate risks
        List<OrderRisk> risks = riskEngine.evaluateRisks(order, twin);
        boolean activeRecovery = false;

        // 3. Evaluate recovery if risks detected
        if (!risks.isEmpty()) {
            for (OrderRisk risk : risks) {
                if ("ACTIVE".equalsIgnoreCase(risk.getStatus())) {
                    var plan = recoveryEngine.evaluateAndTriggerRecovery(order, risk);
                    if (plan.requiresApproval) {
                        activeRecovery = true;
                    }
                }
            }
        }

        // 4. Determine overall health
        String healthState = healthEngine.determineOverallHealth(order, twin, activeRecovery);
        twin.setOverallHealth(healthState);
        twin.setTimestamp(LocalDateTime.now());
        OrderDigitalTwin savedTwin = twinRepository.save(twin);

        // Record health snapshot
        OrderHealthSnapshot snapshot = OrderHealthSnapshot.builder()
                .orderId(orderId)
                .timestamp(LocalDateTime.now())
                .healthState(healthState)
                .notes("Computed by OrderBrain.")
                .build();
        healthSnapshotRepository.save(snapshot);

        // Broadcast twin updates
        broadcastTwinUpdate(savedTwin);

        return savedTwin;
    }

    @Transactional
    public void handleCustomerDecision(Long orderId, String actionId, String decision) {
        log.info("Customer decision received: orderId={} actionId={} decision={}", orderId, actionId, decision);
        OrderRecoveryAction action = recoveryActionRepository.findByActionId(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Recovery action not found: " + actionId));

        if (!"WAITING_APPROVAL".equalsIgnoreCase(action.getStatus())) {
            throw new IllegalStateException("Action is not in WAITING_APPROVAL state.");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        action.setStatus("RESOLVED");
        action.setResult("Customer selected: " + decision);
        action.setNewState(decision);
        recoveryActionRepository.save(action);

        // Record on timeline
        OrderOperationalTimeline t = OrderOperationalTimeline.builder()
                .orderId(orderId)
                .timestamp(LocalDateTime.now())
                .title("Customer Action Resolved")
                .description("Selected alternative: " + decision)
                .eventType("CUSTOMER_DECISION_RESOLVED")
                .customerVisible(true)
                .correlationId(UUID.randomUUID().toString())
                .build();
        timelineRepository.save(t);

        // Resolve risk if type was item unavailability
        riskEngine.resolveRisk(orderId, "ITEM_UNAVAILABLE", "Customer selected: " + decision);

        // Re-process order state
        updateAndProcessOrder(orderId);
    }

    @Transactional
    public void recordTimelineEvent(Long orderId, String title, String description, String eventType, boolean visible) {
        OrderOperationalTimeline t = OrderOperationalTimeline.builder()
                .orderId(orderId)
                .timestamp(LocalDateTime.now())
                .title(title)
                .description(description)
                .eventType(eventType)
                .customerVisible(visible)
                .correlationId(UUID.randomUUID().toString())
                .build();
        timelineRepository.save(t);
    }

    private void broadcastTwinUpdate(OrderDigitalTwin twin) {
        try {
            String destination = "/topic/order/" + twin.getOrderId() + "/twin";
            messagingTemplate.convertAndSend(destination, twin);
        } catch (Exception e) {
            log.error("Failed to broadcast twin updates via WebSocket", e);
        }
    }
}
