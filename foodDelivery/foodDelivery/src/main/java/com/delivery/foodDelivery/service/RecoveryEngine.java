package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DeliveryRecoveryAction;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.DeliveryRecoveryActionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecoveryEngine {

    private final DeliveryRecoveryActionRepository recoveryActionRepository;
    private final PolicyEngine policyEngine;
    private final WalletService walletService;
    private final KafkaService kafkaService;
    private final ObjectMapper objectMapper;

    @Transactional
    public boolean triggerRecovery(Order order, String riskLevel, double probability, int delayMinutes, String reason) {
        log.info("Triggering recovery evaluations for order {} with riskLevel={}, delayMinutes={}", 
                order.getId(), riskLevel, delayMinutes);

        boolean actionsTaken = false;

        // 1. Automatic Compensation for Critical/High delays (SLA Breach)
        if ("CRITICAL".equalsIgnoreCase(riskLevel) || delayMinutes > 10) {
            boolean eligible = policyEngine.evaluate("COMPENSATE", order.getId(), reason, probability);
            if (eligible) {
                compensateCustomer(order, delayMinutes);
                actionsTaken = true;
            } else {
                log.warn("Compensation policy evaluation returned false for order {}", order.getId());
            }
        }

        // 2. Proactive Customer Notification
        if (delayMinutes > 5) {
            boolean notifyAllowed = policyEngine.evaluate("NOTIFY_CUSTOMER", order.getId(), reason, probability);
            if (notifyAllowed) {
                notifyCustomerOfDelay(order, delayMinutes);
                actionsTaken = true;
            }
        }

        // 3. Support Ticket Escalation
        if ("CRITICAL".equalsIgnoreCase(riskLevel) && delayMinutes > 15) {
            boolean supportAllowed = policyEngine.evaluate("TRIGGER_SUPPORT", order.getId(), reason, probability);
            if (supportAllowed) {
                escalateToSupport(order, reason, delayMinutes);
                actionsTaken = true;
            }
        }

        return actionsTaken;
    }

    private void compensateCustomer(Order order, int delayMinutes) {
        Long customerId = order.getCustomer().getId();
        double coinsCompensation = 50.0; // 50 Coins flat compensation for SLA breach
        log.info("Executing automatic compensation of {} coins for customer {} on order {}", 
                coinsCompensation, customerId, order.getId());

        walletService.addCoins(customerId, coinsCompensation);

        log.info("Compensation completed successfully for customer {}", customerId);

        // Record action
        saveRecoveryAction(order.getId(), "COMPENSATE", 
                String.format("Automatic SLA breach compensation of %.1f coins.", coinsCompensation), 
                "COMPLETED", Map.of("coins", coinsCompensation, "delay", delayMinutes));

        // Publish event
        publishRecoveryEvent(order.getId(), "COMPENSATE", "COMPLETED", 
                String.format("Compensated customer %d with %.1f coins due to %d minutes predicted delay.", 
                        customerId, coinsCompensation, delayMinutes));
    }

    private void notifyCustomerOfDelay(Order order, int delayMinutes) {
        log.info("Sending proactive delay notification to customer {} for order {}", 
                order.getCustomer().getId(), order.getId());

        saveRecoveryAction(order.getId(), "NOTIFY_CUSTOMER", 
                String.format("Proactive notification for predicted delay of %d minutes.", delayMinutes), 
                "COMPLETED", Map.of("delay", delayMinutes));

        publishRecoveryEvent(order.getId(), "NOTIFY_CUSTOMER", "COMPLETED", 
                String.format("Notified customer of predicted %d minutes delay.", delayMinutes));
    }

    private void escalateToSupport(Order order, String reason, int delayMinutes) {
        log.warn("CRITICAL DELAY: Escalating order {} to manual Customer Support", order.getId());

        saveRecoveryAction(order.getId(), "TRIGGER_SUPPORT", 
                String.format("Escalated to customer support due to critical delay of %d mins: %s", delayMinutes, reason), 
                "COMPLETED", Map.of("reason", reason, "delay", delayMinutes));

        publishRecoveryEvent(order.getId(), "TRIGGER_SUPPORT", "COMPLETED", 
                String.format("Escalated order to support. Predicted delay: %d minutes.", delayMinutes));
    }

    private void saveRecoveryAction(Long orderId, String actionType, String reason, String status, Map<String, Object> payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            DeliveryRecoveryAction action = DeliveryRecoveryAction.builder()
                    .orderId(orderId)
                    .actionType(actionType)
                    .reason(reason)
                    .status(status)
                    .payloadJson(payloadJson)
                    .build();
            recoveryActionRepository.save(action);
        } catch (Exception e) {
            log.error("Failed to save recovery action log for order {}", orderId, e);
        }
    }

    private void publishRecoveryEvent(Long orderId, String actionType, String status, String details) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("actionType", actionType);
            payload.put("status", status);
            payload.put("details", details);

            String message = objectMapper.writeValueAsString(Map.of(
                    "eventId", UUID.randomUUID().toString(),
                    "eventType", "DELIVERY_RECOVERY_TRIGGERED",
                    "orderId", orderId,
                    "timestamp", System.currentTimeMillis(),
                    "source", "RECOVERY_ENGINE",
                    "payload", payload
            ));
            kafkaService.sendMessage("foodiq.delivery.recovery.triggered", message);
        } catch (Exception e) {
            log.error("Failed to publish recovery event to Kafka", e);
        }
    }
}
