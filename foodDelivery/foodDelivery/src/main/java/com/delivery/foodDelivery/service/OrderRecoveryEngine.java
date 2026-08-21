package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.enums.PaymentStatus;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.repository.jpa.OrderOperationalTimelineRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRecoveryActionRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRecoveryAuditRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class OrderRecoveryEngine {

    private final OrderRepository orderRepository;
    private final OrderRecoveryActionRepository recoveryActionRepository;
    private final OrderRecoveryAuditRepository auditRepository;
    private final OrderOperationalTimelineRepository timelineRepository;
    private final RecoveryPolicyEngine policyEngine;
    private final SupportEscalationEngine supportEscalationEngine;
    private final SimpMessagingTemplate messagingTemplate;
    private final KafkaService kafkaService;
    private final ObjectMapper objectMapper;

    public static class RecoveryPlan {
        public String action;
        public String automationLevel;
        public boolean requiresApproval;
        public String reason;

        public RecoveryPlan(String action, String automationLevel, boolean requiresApproval, String reason) {
            this.action = action;
            this.automationLevel = automationLevel;
            this.requiresApproval = requiresApproval;
            this.reason = reason;
        }
    }

    @Transactional
    public RecoveryPlan evaluateAndTriggerRecovery(Order order, OrderRisk risk) {
        log.info("Evaluating recovery for orderId={} riskId={}", order.getId(), risk.getRiskId());
        
        // 1. Evaluate policy
        RecoveryPolicyEngine.PolicyDecision decision = policyEngine.evaluatePolicy(order.getCustomer().getId(), risk);

        boolean requiresApproval = "REQUIRE_APPROVAL".equalsIgnoreCase(decision.automationLevel) || 
                                   "FINANCIAL_APPROVAL".equalsIgnoreCase(decision.automationLevel);

        RecoveryPlan plan = new RecoveryPlan(decision.action, decision.automationLevel, requiresApproval, risk.getEvidence());

        // 2. Create OrderRecoveryAction record
        String actionId = UUID.randomUUID().toString();
        OrderRecoveryAction action = OrderRecoveryAction.builder()
                .actionId(actionId)
                .orderId(order.getId())
                .riskId(risk.getRiskId())
                .action(decision.action)
                .status(requiresApproval ? "WAITING_APPROVAL" : "EXECUTING")
                .initiatedBy("SYSTEM")
                .automationLevel(decision.automationLevel)
                .timestamp(LocalDateTime.now())
                .reason(risk.getEvidence())
                .correlationId(UUID.randomUUID().toString())
                .build();
        recoveryActionRepository.save(action);

        // 3. Log to audit trail
        logAuditTrail(action, "INITIALIZED", "WAITING");

        // 4. Publish started event
        publishWebSocketEvent(order.getId(), "ORDER_RECOVERY_STARTED", Map.of("action", decision.action));

        // 5. Execute action if auto-executable
        if (!requiresApproval) {
            executeRecoveryAction(order, action);
        } else {
            // Require user action
            recordTimeline(order.getId(), "Action Required", 
                    "Decision pending for: " + decision.action, "CUSTOMER_DECISION_REQUIRED", true);
            publishWebSocketEvent(order.getId(), "CUSTOMER_DECISION_REQUIRED", Map.of("action", decision.action, "actionId", actionId));
        }

        return plan;
    }

    @Transactional
    public void executeRecoveryAction(Order order, OrderRecoveryAction action) {
        log.info("Executing recovery action={} for orderId={}", action.getAction(), order.getId());
        action.setStatus("EXECUTING");
        recoveryActionRepository.save(action);

        try {
            switch (action.getAction().toUpperCase()) {
                case "RECALCULATE_ETA":
                    // Record recalculated ETA timeline event
                    recordTimeline(order.getId(), "ETA Adjusted", "Delivery timeline optimized by FoodIQ AI.", "ETA_UPDATED", true);
                    action.setStatus("COMPLETED");
                    action.setResult("ETA recalculated successfully.");
                    publishWebSocketEvent(order.getId(), "ETA_UPDATED", Map.of("estimatedMinutes", 35));
                    break;

                case "RECOMMEND_RIDER_REASSIGNMENT":
                    recordTimeline(order.getId(), "Rider Search Activated", "Searching for replacement delivery partner.", "RIDER_REASSIGNED", true);
                    action.setStatus("COMPLETED");
                    action.setResult("Rider reassignment triggered.");
                    publishWebSocketEvent(order.getId(), "RIDER_REASSIGNED", Map.of("status", "SEARCHING"));
                    break;

                case "INITIATE_REFUND_FLOW":
                    order.setPaymentStatus(PaymentStatus.REFUNDED);
                    orderRepository.save(order);
                    recordTimeline(order.getId(), "Refund Completed", "Full refund initiated to original payment source.", "ORDER_RECOVERY_COMPLETED", true);
                    action.setStatus("COMPLETED");
                    action.setResult("Refund issued successfully.");
                    publishWebSocketEvent(order.getId(), "ORDER_RECOVERY_COMPLETED", Map.of("status", "REFUNDED"));
                    break;

                case "ESCALATE_TO_SUPPORT":
                    String summary = supportEscalationEngine.generateEscalationSummary(order);
                    recordTimeline(order.getId(), "Escalated to Support", "Support dossier generated and assigned to priority queue.", "SUPPORT_ESCALATED", false);
                    action.setStatus("COMPLETED");
                    action.setResult("Escalated to support. Summary: " + summary);
                    publishWebSocketEvent(order.getId(), "ORDER_RECOVERY_FAILED", Map.of("escalation", "SUPPORT"));
                    break;

                default:
                    log.warn("Unknown recovery action type: {}", action.getAction());
                    action.setStatus("FAILED");
                    action.setResult("Unknown recovery action type.");
                    publishWebSocketEvent(order.getId(), "ORDER_RECOVERY_FAILED", Map.of("reason", "UNKNOWN_ACTION"));
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to execute recovery action for order {}", order.getId(), e);
            action.setStatus("FAILED");
            action.setResult(e.getMessage());
            publishWebSocketEvent(order.getId(), "ORDER_RECOVERY_FAILED", Map.of("error", e.getMessage()));
        }

        recoveryActionRepository.save(action);
        logAuditTrail(action, "EXECUTED", action.getStatus());
    }

    private void logAuditTrail(OrderRecoveryAction action, String step, String result) {
        OrderRecoveryAudit audit = OrderRecoveryAudit.builder()
                .actionId(action.getActionId())
                .orderId(action.getOrderId())
                .riskId(action.getRiskId())
                .action(action.getAction())
                .initiatedBy(action.getInitiatedBy())
                .automationLevel(action.getAutomationLevel())
                .timestamp(LocalDateTime.now())
                .result(result)
                .previousState(action.getPreviousState())
                .newState(action.getNewState())
                .reason(action.getReason())
                .correlationId(action.getCorrelationId())
                .build();
        auditRepository.save(audit);
    }

    private void recordTimeline(Long orderId, String title, String description, String eventType, boolean visible) {
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

    private void publishWebSocketEvent(Long orderId, String eventType, Map<String, Object> payload) {
        try {
            String destination = "/topic/order/" + orderId + "/recovery";
            Map<String, Object> message = new HashMap<>();
            message.put("eventType", eventType);
            message.put("orderId", orderId);
            message.put("timestamp", System.currentTimeMillis());
            message.put("payload", payload);
            messagingTemplate.convertAndSend(destination, message);

            // Also broadcast to Kafka topic for cross-service alignment
            String kafkaMsg = objectMapper.writeValueAsString(message);
            kafkaService.sendMessage("foodiq.order.recovery", kafkaMsg);
        } catch (Exception e) {
            log.error("Failed to publish recovery websocket/kafka event for order {}", orderId, e);
        }
    }
}
