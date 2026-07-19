package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.service.FinancialService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
public class FinancialController {

    private final FinancialService financialService;

    @GetMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkout(
            @RequestParam Double subtotal,
            @RequestParam(defaultValue = "0.0") Double discount,
            @RequestParam(defaultValue = "0.0") Double coinsUsed,
            @RequestParam(required = false) Long userId) {
        
        Map<String, Object> pricing = financialService.calculateCheckoutPrice(subtotal, discount, coinsUsed, userId);
        return ResponseEntity.ok(ApiResponse.success(pricing));
    }

    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<Transaction>> processPayment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestParam String orderId,
            @RequestParam String customerId,
            @RequestParam String restaurantId,
            @RequestParam Double amount,
            @RequestParam(defaultValue = "0.0") Double walletDeduction,
            @RequestParam String paymentMethod,
            @RequestParam(required = false) String gateway) {

        Transaction tx = financialService.processPayment(idempotencyKey, orderId, customerId, restaurantId, amount, walletDeduction, paymentMethod, gateway);
        return ResponseEntity.ok(ApiResponse.success(tx));
    }

    @PostMapping("/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Refund>> refund(
            @RequestParam String transactionId,
            @RequestParam Double amount,
            @RequestParam String channel,
            @RequestParam String reason) {

        Refund refund = financialService.initiateRefund(transactionId, amount, channel, reason);
        return ResponseEntity.ok(ApiResponse.success(refund));
    }

    @PostMapping("/settle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Settlement>> triggerSettlement(
            @RequestParam String restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        Settlement settlement = financialService.calculateRestaurantSettlement(restaurantId, start, end);
        return ResponseEntity.ok(ApiResponse.success(settlement));
    }

    @PostMapping("/payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Payout>> triggerPayout(
            @RequestParam String driverId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        Payout payout = financialService.calculateDriverPayout(driverId, start, end);
        return ResponseEntity.ok(ApiResponse.success(payout));
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<ApiResponse<Subscription>> subscribe(
            @RequestParam String userId,
            @RequestParam String planType,
            @RequestParam String billingCycle,
            @RequestParam Double price) {

        Subscription subscription = financialService.createSubscription(userId, planType, billingCycle, price);
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    @PostMapping("/giftcards/purchase")
    public ResponseEntity<ApiResponse<GiftCard>> purchaseGiftCard(
            @RequestParam String purchaserId,
            @RequestParam Double amount) {

        GiftCard card = financialService.purchaseGiftCard(purchaserId, amount);
        return ResponseEntity.ok(ApiResponse.success(card));
    }

    @PostMapping("/giftcards/redeem")
    public ResponseEntity<ApiResponse<GiftCard>> redeemGiftCard(
            @RequestParam String code,
            @RequestParam String receiverId) {

        GiftCard card = financialService.redeemGiftCard(code, receiverId);
        return ResponseEntity.ok(ApiResponse.success(card));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(financialService.getFinancialAnalytics()));
    }
}
