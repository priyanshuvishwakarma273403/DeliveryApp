package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.AlternativeRankingEngine;
import com.delivery.foodDelivery.service.OrderBrain;
import com.delivery.foodDelivery.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderBrainController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderDigitalTwinRepository twinRepository;
    private final OrderRiskRepository riskRepository;
    private final OrderRecoveryActionRepository recoveryActionRepository;
    private final OrderOperationalTimelineRepository timelineRepository;
    private final CustomerRecoveryPreferenceRepository preferenceRepository;
    
    private final OrderBrain orderBrain;
    private final AlternativeRankingEngine alternativeRankingEngine;

    @GetMapping("/{orderId}/twin")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OrderDigitalTwin>> getOrderTwin(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        OrderDigitalTwin twin = orderBrain.updateAndProcessOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(twin));
    }

    @GetMapping("/{orderId}/health")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> getOrderHealth(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        OrderDigitalTwin twin = orderBrain.updateAndProcessOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order Health", twin.getOverallHealth()));
    }

    @GetMapping("/{orderId}/timeline")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderOperationalTimeline>>> getOrderTimeline(
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "true") boolean customerOnly,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        
        List<OrderOperationalTimeline> timeline;
        if (customerOnly && !isAdmin(userDetails)) {
            timeline = timelineRepository.findByOrderIdAndCustomerVisibleOrderByTimestampAsc(orderId, true);
        } else {
            timeline = timelineRepository.findByOrderIdOrderByTimestampAsc(orderId);
        }
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @GetMapping("/{orderId}/risks")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderRisk>>> getOrderRisks(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        List<OrderRisk> risks = riskRepository.findByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(risks));
    }

    @GetMapping("/{orderId}/recovery")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderRecoveryAction>>> getOrderRecoveryActions(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        List<OrderRecoveryAction> actions = recoveryActionRepository.findByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(actions));
    }

    @Data
    public static class DecisionRequest {
        private String actionId;
        private String decision;
    }

    @PostMapping("/{orderId}/recovery/decision")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> submitRecoveryDecision(
            @PathVariable Long orderId,
            @RequestBody DecisionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        orderBrain.handleCustomerDecision(orderId, request.getActionId(), request.getDecision());
        return ResponseEntity.ok(ApiResponse.success("Decision processed successfully"));
    }

    @GetMapping("/{orderId}/alternatives")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuItem>>> getAlternatives(
            @PathVariable Long orderId,
            @RequestParam String menuItemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Order order = validateOwnershipAndGet(orderId, userDetails);
        List<MenuItem> alternatives = alternativeRankingEngine.getAlternatives(order.getCustomer().getId(), menuItemId);
        return ResponseEntity.ok(ApiResponse.success(alternatives));
    }

    @Data
    public static class SettingsRequest {
        private boolean autoUpdateEta;
        private boolean autoSubstituteSamePrice;
        private boolean autoRemoveItem;
        private boolean askEveryTime;
    }

    @GetMapping("/recovery/settings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerRecoveryPreference>> getSettings(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        CustomerRecoveryPreference pref = preferenceRepository.findByCustomerId(userId)
                .orElseGet(() -> preferenceRepository.save(CustomerRecoveryPreference.builder()
                        .customerId(userId)
                        .autoUpdateEta(true)
                        .autoSubstituteSamePrice(false)
                        .autoRemoveItem(false)
                        .askEveryTime(true)
                        .build()));
        return ResponseEntity.ok(ApiResponse.success(pref));
    }

    @PostMapping("/recovery/settings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerRecoveryPreference>> updateSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SettingsRequest request) {
        Long userId = resolveUserId(userDetails);
        CustomerRecoveryPreference pref = preferenceRepository.findByCustomerId(userId)
                .orElseGet(() -> CustomerRecoveryPreference.builder().customerId(userId).build());

        pref.setAutoUpdateEta(request.isAutoUpdateEta());
        pref.setAutoSubstituteSamePrice(request.isAutoSubstituteSamePrice());
        pref.setAutoRemoveItem(request.isAutoRemoveItem());
        pref.setAskEveryTime(request.isAskEveryTime());

        CustomerRecoveryPreference saved = preferenceRepository.save(pref);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", saved));
    }

    // ── Helper Validators ─────────────────────────

    private Order validateOwnershipAndGet(Long orderId, UserDetails userDetails) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!isAdmin(userDetails)) {
            Long userId = resolveUserId(userDetails);
            if (!order.getCustomer().getId().equals(userId)) {
                throw new SecurityException("Access Denied: You do not own this order.");
            }
        }
        return order;
    }

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
