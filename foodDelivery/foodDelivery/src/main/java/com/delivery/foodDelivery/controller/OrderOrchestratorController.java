package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.PolicyEngine;
import com.delivery.foodDelivery.service.RecoveryEngine;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/orchestrator")
@RequiredArgsConstructor
@Slf4j
public class OrderOrchestratorController {

    private final OrderRepository orderRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final DeliveryRecoveryActionRepository recoveryActionRepository;
    private final DeliveryRiskEventRepository riskEventRepository;
    private final PolicyEngine policyEngine;
    private final RecoveryEngine recoveryEngine;

    @Data
    @Builder
    public static class ActiveOrderDto {
        private Long orderId;
        private String customerName;
        private String restaurantId;
        private String status;
        private String riderName;
        private String riskLevel;
        private Integer delayMinutes;
    }

    @GetMapping("/orders/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ActiveOrderDto>> getActiveOrders() {
        List<Order> activeOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() != OrderStatus.DELIVERED 
                        && o.getStatus() != OrderStatus.CANCELLED 
                        && o.getStatus() != OrderStatus.REJECTED
                        && o.getStatus() != OrderStatus.PAYMENT_FAILED
                        && o.getStatus() != OrderStatus.RESTAURANT_CANCELLED
                        && o.getStatus() != OrderStatus.REFUNDED)
                .collect(Collectors.toList());

        List<ActiveOrderDto> dtos = activeOrders.stream().map(order -> {
            String riderName = "Unassigned";
            if (order.getDelivery() != null && order.getDelivery().getDeliveryPartner() != null) {
                riderName = order.getDelivery().getDeliveryPartner().getUser().getName();
            }

            // Retrieve latest active risk event if any
            List<DeliveryRiskEvent> risks = riskEventRepository.findByOrderIdAndStatus(order.getId(), "ACTIVE");
            String riskLevel = "LOW";
            int delayMinutes = 0;
            if (!risks.isEmpty()) {
                DeliveryRiskEvent r = risks.get(0);
                riskLevel = r.getRiskLevel();
                delayMinutes = r.getPredictedDelayMinutes() != null ? r.getPredictedDelayMinutes() : 0;
            }

            return ActiveOrderDto.builder()
                    .orderId(order.getId())
                    .customerName(order.getCustomer() != null ? order.getCustomer().getName() : "Unknown")
                    .restaurantId(order.getRestaurantId())
                    .status(order.getStatus().name())
                    .riderName(riderName)
                    .riskLevel(riskLevel)
                    .delayMinutes(delayMinutes)
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @Data
    public static class PolicyEvaluationRequest {
        private String actionType;
        private Long orderId;
        private String reason;
        private double confidence;
    }

    @PostMapping("/policy/evaluate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> evaluatePolicy(@RequestBody PolicyEvaluationRequest request) {
        boolean allowed = policyEngine.evaluate(
                request.getActionType(), 
                request.getOrderId(), 
                request.getReason(), 
                request.getConfidence()
        );
        Map<String, Object> response = new HashMap<>();
        response.put("allowed", allowed);
        response.put("actionType", request.getActionType());
        response.put("orderId", request.getOrderId());
        return ResponseEntity.ok(response);
    }

    @Data
    public static class ManualRecoveryRequest {
        private Long orderId;
        private String actionType; // COMPENSATE, REASSIGN_RIDER, etc.
        private String reason;
    }

    @PostMapping("/recovery/action")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> triggerManualRecovery(@RequestBody ManualRecoveryRequest request) {
        log.info("Manual recovery action requested by Admin: action={}, order={}", request.getActionType(), request.getOrderId());
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        boolean success = false;
        if ("COMPENSATE".equalsIgnoreCase(request.getActionType())) {
            // Evaluates automatically with 100% confidence override for manual intervention
            success = recoveryEngine.triggerRecovery(order, "CRITICAL", 1.0, 15, request.getReason());
        } else {
            success = recoveryEngine.triggerRecovery(order, "HIGH", 1.0, 5, request.getReason());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("orderId", request.getOrderId());
        response.put("actionTriggered", request.getActionType());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOrchestratorMetrics() {
        long totalOrders = orderRepository.count();
        
        // Count SLA breaches (high/critical delay risk events)
        long slaBreaches = riskEventRepository.findAll().stream()
                .filter(r -> "CRITICAL".equalsIgnoreCase(r.getRiskLevel()) || "HIGH".equalsIgnoreCase(r.getRiskLevel()))
                .map(DeliveryRiskEvent::getOrderId)
                .distinct()
                .count();

        double breachRate = totalOrders == 0 ? 0.0 : (double) slaBreaches / totalOrders * 100.0;

        // Rider utilization
        long totalRiders = partnerRepository.count();
        long busyRiders = partnerRepository.findAll().stream()
                .filter(p -> !p.isAvailable())
                .count();

        double riderUtilization = totalRiders == 0 ? 0.0 : (double) busyRiders / totalRiders * 100.0;

        // Auto recovery success rate
        List<DeliveryRecoveryAction> recoveries = recoveryActionRepository.findAll();
        long completedRecoveries = recoveries.stream()
                .filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus()))
                .count();

        double recoverySuccessRate = recoveries.isEmpty() ? 100.0 : (double) completedRecoveries / recoveries.size() * 100.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("slaBreachRatePercentage", breachRate);
        metrics.put("riderUtilizationPercentage", riderUtilization);
        metrics.put("autoRecoverySuccessRatePercentage", recoverySuccessRate);
        metrics.put("totalActiveRecoveriesCount", recoveries.stream().filter(r -> "TRIGGERED".equalsIgnoreCase(r.getStatus())).count());

        return ResponseEntity.ok(metrics);
    }
}
