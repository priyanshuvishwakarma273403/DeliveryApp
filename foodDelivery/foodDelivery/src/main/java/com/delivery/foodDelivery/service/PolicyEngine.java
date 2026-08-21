package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DeliveryPolicyConfig;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.DeliveryPolicyConfigRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.repository.mongo.FraudAuditLogRepository;
import com.delivery.foodDelivery.repository.mongo.FraudCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyEngine {

    private final DeliveryPolicyConfigRepository policyConfigRepository;
    private final FraudAuditLogRepository fraudAuditLogRepository;
    private final FraudCaseRepository fraudCaseRepository;
    private final OrderRepository orderRepository;

    public boolean evaluate(String actionType, Long orderId, String reason, double confidence) {
        log.info("Evaluating policy for action={} orderId={} confidence={}", actionType, orderId, confidence);

        // Basic safety constraints
        if (confidence < 0.60) {
            log.warn("Action rejected: Confidence score {} is below the safety threshold (60%)", confidence);
            return false;
        }

        // Action-specific policy rules
        switch (actionType.toUpperCase()) {
            case "ASSIGN_RIDER":
                return true; // Always allowed if confidence threshold is met
            case "REASSIGN_RIDER":
                return evaluateReassignRider(orderId);
            case "CREATE_BATCH":
                return getPolicyBoolean("batching.enabled", true);
            case "COMPENSATE":
                return evaluateCompensationEligibility(orderId);
            case "NOTIFY_CUSTOMER":
                return true;
            case "TRIGGER_SUPPORT":
                return true;
            default:
                log.warn("Unknown policy action: {}", actionType);
                return false;
        }
    }

    private boolean evaluateReassignRider(Long orderId) {
        // Only allow reassignment if not already picked up
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return false;
        
        String status = order.getStatus().name();
        return !"PICKED_UP".equalsIgnoreCase(status) && !"OUT_FOR_DELIVERY".equalsIgnoreCase(status);
    }

    private boolean evaluateCompensationEligibility(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return false;

        Long customerId = order.getCustomer().getId();

        // 1. Check if user has active fraud cases
        Optional<com.delivery.foodDelivery.entity.FraudCase> optCase = fraudCaseRepository.findByEntityId(String.valueOf(customerId));
        if (optCase.isPresent() && ("OPEN".equalsIgnoreCase(optCase.get().getStatus()) || "UNDER_INVESTIGATION".equalsIgnoreCase(optCase.get().getStatus()))) {
            log.warn("Compensation REJECTED: User {} has active fraud case: status={}", customerId, optCase.get().getStatus());
            return false;
        }

        // 2. Check if velocity threshold for refunds has been exceeded
        long recentRefundLogs = fraudAuditLogRepository.findAll().stream()
                .filter(log -> String.valueOf(customerId).equals(log.getTargetEntityId()) 
                        && "COMPENSATE".equalsIgnoreCase(log.getActionTaken())
                        && log.getTimestamp() != null 
                        && log.getTimestamp().isAfter(java.time.LocalDateTime.now().minusDays(1)))
                .count();

        int maxRefundsPerDay = getPolicyInteger("max.refunds.per.day", 2);
        if (recentRefundLogs >= maxRefundsPerDay) {
            log.warn("Compensation REJECTED: User {} exceeded refund limit of {} per day", customerId, maxRefundsPerDay);
            return false;
        }

        return true;
    }

    public String getPolicyString(String key, String defaultValue) {
        return policyConfigRepository.findByPolicyKey(key)
                .map(DeliveryPolicyConfig::getPolicyValue)
                .orElse(defaultValue);
    }

    public boolean getPolicyBoolean(String key, boolean defaultValue) {
        return policyConfigRepository.findByPolicyKey(key)
                .map(config -> Boolean.parseBoolean(config.getPolicyValue()))
                .orElse(defaultValue);
    }

    public int getPolicyInteger(String key, int defaultValue) {
        return policyConfigRepository.findByPolicyKey(key)
                .map(config -> Integer.parseInt(config.getPolicyValue()))
                .orElse(defaultValue);
    }

    public double getPolicyDouble(String key, double defaultValue) {
        return policyConfigRepository.findByPolicyKey(key)
                .map(config -> Double.parseDouble(config.getPolicyValue()))
                .orElse(defaultValue);
    }
}
