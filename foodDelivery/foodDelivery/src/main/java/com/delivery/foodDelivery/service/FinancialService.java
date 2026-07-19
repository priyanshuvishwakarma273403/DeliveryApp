package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.dto.request.NotificationRequest;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.mongo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialService {

    private final TransactionRepository transactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final RefundRepository refundRepository;
    private final SettlementRepository settlementRepository;
    private final PayoutRepository payoutRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final GiftCardRepository giftCardRepository;
    private final InvoiceRepository invoiceRepository;
    private final CashbackCampaignRepository cashbackCampaignRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;

    // Simulating gateway health status for smart routing
    private final Map<String, Boolean> gatewayHealth = new ConcurrentHashMap<>();

    // ────────────────────────────────────────────────────────────────────────
    // 1. CHECKOUT & PRICING ENGINE
    // ────────────────────────────────────────────────────────────────────────
    public Map<String, Object> calculateCheckoutPrice(Double subtotal, Double discount, Double coinsUsed, Long userId) {
        double packagingCharge = 20.0;
        double deliveryCharge = 40.0;
        double platformFee = 5.0;

        // Taxes: GST (SGST 2.5% + CGST 2.5% = 5%)
        double taxableAmount = subtotal - discount;
        if (taxableAmount < 0) taxableAmount = 0;
        double cgst = Math.round((taxableAmount * 0.025) * 100.0) / 100.0;
        double sgst = Math.round((taxableAmount * 0.025) * 100.0) / 100.0;
        double totalTax = cgst + sgst;

        double finalAmount = taxableAmount + totalTax + packagingCharge + deliveryCharge + platformFee;

        // Apply Wallet Coins
        double walletDeduction = 0.0;
        if (coinsUsed > 0 && userId != null) {
            try {
                Wallet wallet = walletService.getWalletByUserId(userId);
                walletDeduction = Math.min(wallet.getBalance(), coinsUsed);
                walletDeduction = Math.min(walletDeduction, finalAmount);
                finalAmount -= walletDeduction;
            } catch (Exception e) {
                log.warn("Could not apply wallet coins for user {}: {}", userId, e.getMessage());
            }
        }

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("subtotal", subtotal);
        breakdown.put("discount", discount);
        breakdown.put("cgst", cgst);
        breakdown.put("sgst", sgst);
        breakdown.put("packagingCharge", packagingCharge);
        breakdown.put("deliveryCharge", deliveryCharge);
        breakdown.put("platformFee", platformFee);
        breakdown.put("walletDeduction", walletDeduction);
        breakdown.put("finalAmount", Math.round(finalAmount * 100.0) / 100.0);
        breakdown.put("estimatedDeliveryTime", "25 - 35 mins");
        return breakdown;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. TRANSACTION PROCESSING & IDEMPOTENCY
    // ────────────────────────────────────────────────────────────────────────
    public Transaction processPayment(String idempotencyKey, String orderId, String customerId, 
                                      String restaurantId, Double amount, Double walletDeduction, 
                                      String paymentMethod, String gatewayOverride) {
        
        // Idempotency check: Return transaction if duplicate
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Duplicate request matched for key {}. Returning existing transaction.", idempotencyKey);
                return existing.get();
            }
        }

        // Fraud prevention velocity check
        detectFraudVelocity(customerId);

        // Gateway smart selection
        String selectedGateway = getOptimalGateway(gatewayOverride);
        log.info("Smart routing selected gateway: {} for payment of amount: {}", selectedGateway, amount);

        Transaction transaction = Transaction.builder()
                .idempotencyKey(idempotencyKey)
                .orderId(orderId)
                .customerId(customerId)
                .restaurantId(restaurantId)
                .paymentMethod(paymentMethod)
                .gatewayName(selectedGateway)
                .status("CREATED")
                .amount(amount + walletDeduction)
                .walletDeductionAmount(walletDeduction)
                .gatewayAmount(amount)
                .currency("INR")
                .timestamp(LocalDateTime.now())
                .build();

        transactionRepository.save(transaction);

        try {
            // Deduct from Wallet if mixed payment
            if (walletDeduction > 0) {
                walletService.spendCoins(Long.parseLong(customerId), walletDeduction);
                recordWalletLedger(customerId, "CUSTOMER", walletDeduction, "DEBIT", "ORDER_PAYMENT", 
                                   "Order #" + orderId + " payment contribution");
            }

            // Gateway simulation
            if ("COD".equalsIgnoreCase(paymentMethod)) {
                transaction.setStatus("CAPTURED");
                transaction.setGatewayTransactionId("COD_" + UUID.randomUUID().toString().substring(0, 8));
            } else {
                boolean success = simulateGatewayTransaction(selectedGateway, amount);
                if (success) {
                    transaction.setStatus("CAPTURED");
                    transaction.setGatewayTransactionId(selectedGateway.substring(0, 3) + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                } else {
                    // Gateway Failover mechanism
                    log.warn("Gateway {} failed. Retrying failover gateway...", selectedGateway);
                    String failoverGateway = getFailoverGateway(selectedGateway);
                    boolean failoverSuccess = simulateGatewayTransaction(failoverGateway, amount);
                    if (failoverSuccess) {
                        transaction.setStatus("CAPTURED");
                        transaction.setGatewayName(failoverGateway);
                        transaction.setGatewayTransactionId(failoverGateway.substring(0, 3) + "_FO_" + UUID.randomUUID().toString().substring(0, 8));
                    } else {
                        throw new RuntimeException("All primary and secondary gateways failed to process payment.");
                    }
                }
            }

            transaction.setStatus("COMPLETED");
            transactionRepository.save(transaction);

            // Generate Invoices
            generateInvoice(transaction);

            // Apply Cashback
            applyEarnedCashback(customerId, amount + walletDeduction);

            // Trigger Notification
            sendPaymentAlert(customerId, orderId, amount, true, null);

        } catch (Exception e) {
            log.error("Payment transaction failed: {}", e.getMessage());
            transaction.setStatus("FAILED");
            transaction.setFailureReason(e.getMessage());
            transactionRepository.save(transaction);

            // Rollback wallet deduction if debited
            if (walletDeduction > 0) {
                walletService.addCoins(Long.parseLong(customerId), walletDeduction);
                recordWalletLedger(customerId, "CUSTOMER", walletDeduction, "CREDIT", "REFUND", 
                                   "Rollback of order contribution due to payment gateway failure");
            }

            sendPaymentAlert(customerId, orderId, amount, false, e.getMessage());
        }

        return transaction;
    }

    private boolean simulateGatewayTransaction(String gateway, Double amount) {
        // High success simulation: Razorpay (96%), Stripe (95%), PayU (92%)
        double chance = Math.random();
        if ("RAZORPAY".equals(gateway)) return chance > 0.04;
        if ("STRIPE".equals(gateway)) return chance > 0.05;
        return chance > 0.08;
    }

    private String getOptimalGateway(String override) {
        if (override != null && !override.isEmpty()) return override;
        
        // Dynamic gateway routing (Razorpay is primary, failover to Stripe)
        boolean razorpayHealthy = gatewayHealth.getOrDefault("RAZORPAY", true);
        if (razorpayHealthy) return "RAZORPAY";
        
        boolean stripeHealthy = gatewayHealth.getOrDefault("STRIPE", true);
        if (stripeHealthy) return "STRIPE";
        
        return "PAYU";
    }

    private String getFailoverGateway(String primary) {
        if ("RAZORPAY".equals(primary)) return "STRIPE";
        return "PAYU";
    }

    // Health monitoring scheduler updating statuses
    @Scheduled(fixedRate = 60000)
    public void runGatewayHealthChecks() {
        gatewayHealth.put("RAZORPAY", Math.random() > 0.02);
        gatewayHealth.put("STRIPE", Math.random() > 0.03);
        gatewayHealth.put("PAYU", Math.random() > 0.05);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. REFUND SYSTEM
    // ────────────────────────────────────────────────────────────────────────
    public Refund initiateRefund(String transactionId, Double amount, String channel, String reason) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for refund ID: " + transactionId));

        if (!"COMPLETED".equalsIgnoreCase(transaction.getStatus()) && 
            !"CAPTURED".equalsIgnoreCase(transaction.getStatus())) {
            throw new RuntimeException("Refunds can only be processed on completed transactions.");
        }

        Refund refund = Refund.builder()
                .transactionId(transactionId)
                .orderId(transaction.getOrderId())
                .amount(amount)
                .type(amount.equals(transaction.getAmount()) ? "FULL" : "PARTIAL")
                .status("PENDING")
                .channel(channel)
                .refundReason(reason)
                .processedBy("AUTO")
                .createdAt(LocalDateTime.now())
                .build();

        refund.getTimeline().add("Refund requested on " + LocalDateTime.now());
        refundRepository.save(refund);

        try {
            if ("WALLET".equalsIgnoreCase(channel)) {
                walletService.addCoins(Long.parseLong(transaction.getCustomerId()), amount);
                recordWalletLedger(transaction.getCustomerId(), "CUSTOMER", amount, "CREDIT", "REFUND", 
                                   "Refund for Order #" + transaction.getOrderId());
                refund.setStatus("SUCCESS");
                refund.setResolvedAt(LocalDateTime.now());
                refund.getTimeline().add("Credited to wallet instantly on " + LocalDateTime.now());
            } else {
                // Simulate payment gateway refund
                boolean success = Math.random() > 0.05;
                if (success) {
                    refund.setStatus("SUCCESS");
                    refund.setGatewayRefundId("RFD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
                    refund.setResolvedAt(LocalDateTime.now());
                    refund.getTimeline().add("Settled back to original payment source via " + transaction.getGatewayName());
                } else {
                    throw new RuntimeException("Gateway rejected or timed out during refund request.");
                }
            }

            refundRepository.save(refund);

            // Generate Credit Note Invoice
            generateRefundInvoice(refund);

            // Update Transaction status
            transaction.setStatus(amount.equals(transaction.getAmount()) ? "REFUND_COMPLETED" : "REFUND_INITIATED");
            transactionRepository.save(transaction);

            // Notify user
            triggerRefundNotification(transaction.getCustomerId(), transaction.getOrderId(), amount, true);

        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            refund.setStatus("FAILED");
            refund.setFailureReason(e.getMessage());
            refund.getTimeline().add("Failed: " + e.getMessage() + " on " + LocalDateTime.now());
            refundRepository.save(refund);

            triggerRefundNotification(transaction.getCustomerId(), transaction.getOrderId(), amount, false);
        }

        return refund;
    }

    @Scheduled(fixedRate = 300000) // retry every 5 minutes
    public void retryFailedRefunds() {
        List<Refund> failed = refundRepository.findByStatus("FAILED");
        if (failed.isEmpty()) return;

        log.info("Found {} failed refunds to retry...", failed.size());
        for (Refund r : failed) {
            if (r.getRetryCount() < 3) {
                r.setRetryCount(r.getRetryCount() + 1);
                r.getTimeline().add("Retrying refund attempt " + r.getRetryCount());
                
                try {
                    // Try wallet as fallback or re-trigger gateway
                    if ("WALLET".equalsIgnoreCase(r.getChannel())) {
                        Transaction t = transactionRepository.findById(r.getTransactionId()).orElse(null);
                        if (t != null) {
                            walletService.addCoins(Long.parseLong(t.getCustomerId()), r.getAmount());
                            recordWalletLedger(t.getCustomerId(), "CUSTOMER", r.getAmount(), "CREDIT", "REFUND", "Refund retry to wallet completed");
                            r.setStatus("SUCCESS");
                            r.setResolvedAt(LocalDateTime.now());
                            r.getTimeline().add("Refund retry completed via Wallet credit.");
                        }
                    } else {
                        r.setStatus("SUCCESS");
                        r.setGatewayRefundId("RFD_R_" + UUID.randomUUID().toString().substring(0, 8));
                        r.setResolvedAt(LocalDateTime.now());
                        r.getTimeline().add("Refund retry completed successfully via original source.");
                    }
                } catch (Exception e) {
                    r.setFailureReason(e.getMessage());
                }
                refundRepository.save(r);
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. RESTAURANT SETTLEMENTS & DRIVER PAYOUTS
    // ────────────────────────────────────────────────────────────────────────
    @Transactional
    public Settlement calculateRestaurantSettlement(String restaurantId, LocalDateTime start, LocalDateTime end) {
        // Calculate settlement for all transactions marked COMPLETED in period
        List<Transaction> transactions = transactionRepository.findByStatus("COMPLETED"); // simplifying query
        
        double totalOrdersAmount = 0.0;
        for (Transaction t : transactions) {
            if (restaurantId.equals(t.getRestaurantId())) {
                totalOrdersAmount += t.getAmount();
            }
        }

        if (totalOrdersAmount == 0) return null;

        double platformsCommissionPct = 0.15; // 15% Platform Commission
        double platformCommission = totalOrdersAmount * platformsCommissionPct;
        double gst = totalOrdersAmount * 0.05; // 5% GST
        double deliveryChargesWithheld = 40.0; // Flat flat delivery charge simulation
        double refundDeductions = 0.0;         // Calculated refunds
        double penalties = 0.0;                // Late prep fees etc.

        double finalSettlement = totalOrdersAmount - platformCommission - gst - deliveryChargesWithheld - penalties - refundDeductions;
        if (finalSettlement < 0) finalSettlement = 0;

        Settlement settlement = Settlement.builder()
                .restaurantId(restaurantId)
                .periodStart(start)
                .periodEnd(end)
                .totalOrdersAmount(totalOrdersAmount)
                .platformCommission(platformCommission)
                .taxesWithheld(gst)
                .deliveryChargesWithheld(deliveryChargesWithheld)
                .penalties(penalties)
                .refundDeductions(refundDeductions)
                .finalSettlementAmount(finalSettlement)
                .status("PENDING")
                .timestamp(LocalDateTime.now())
                .invoiceNumber("SET_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        settlementRepository.save(settlement);

        // Auto trigger bank simulation
        try {
            boolean success = Math.random() > 0.02;
            if (success) {
                settlement.setStatus("COMPLETED");
                settlement.setTransactionId("TXN_SET_" + UUID.randomUUID().toString().substring(0, 10));
                
                // Add to Restaurant's digital wallet ledger
                recordWalletLedger(restaurantId, "RESTAURANT", finalSettlement, "CREDIT", "PLATFORM_PAYOUT", 
                                   "Settlement transfer for period " + start + " to " + end);
            } else {
                settlement.setStatus("FAILED");
            }
            settlementRepository.save(settlement);
        } catch (Exception e) {
            settlement.setStatus("FAILED");
            settlementRepository.save(settlement);
        }

        return settlement;
    }

    @Transactional
    public Payout calculateDriverPayout(String driverId, LocalDateTime start, LocalDateTime end) {
        double baseFee = 350.0;
        double tips = 120.0;
        double rainIncentive = 50.0;
        double nightIncentive = 40.0;
        double bonus = 30.0;
        double totalPayout = baseFee + tips + rainIncentive + nightIncentive + bonus;

        Payout payout = Payout.builder()
                .driverId(driverId)
                .periodStart(start)
                .periodEnd(end)
                .baseDeliveryFee(baseFee)
                .customerTips(tips)
                .rainIncentive(rainIncentive)
                .nightIncentive(nightIncentive)
                .bonusAmount(bonus)
                .totalPayoutAmount(totalPayout)
                .status("PENDING")
                .timestamp(LocalDateTime.now())
                .build();

        payoutRepository.save(payout);

        try {
            payout.setStatus("COMPLETED");
            payout.setTransactionId("TXN_DRV_" + UUID.randomUUID().toString().substring(0, 10));
            payoutRepository.save(payout);
            
            // Add to Driver's digital wallet ledger
            recordWalletLedger(driverId, "DRIVER", totalPayout, "CREDIT", "PLATFORM_PAYOUT", 
                               "Payout for period " + start + " to " + end);
        } catch (Exception e) {
            payout.setStatus("FAILED");
            payoutRepository.save(payout);
        }

        return payout;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. SUBSCRIPTIONS & MEMBER MANAGEMENT
    // ────────────────────────────────────────────────────────────────────────
    public Subscription createSubscription(String userId, String planType, String billingCycle, Double price) {
        Subscription subscription = Subscription.builder()
                .userId(userId)
                .planType(planType)
                .billingCycle(billingCycle)
                .price(price)
                .status("ACTIVE")
                .startDate(LocalDateTime.now())
                .endDate("YEARLY".equalsIgnoreCase(billingCycle) ? LocalDateTime.now().plusYears(1) : LocalDateTime.now().plusMonths(1))
                .autoRenew(true)
                .lastPaymentDate(LocalDateTime.now())
                .build();

        subscriptionRepository.save(subscription);

        // Update User Gold status if Plan is Gold
        if ("GOLD".equalsIgnoreCase(planType)) {
            try {
                Wallet wallet = walletService.getWalletByUserId(Long.parseLong(userId));
                wallet.setGoldMember(true);
            } catch (Exception e) {
                log.warn("Could not set gold status for user wallet: {}", e.getMessage());
            }
        }

        return subscription;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. GIFT CARDS
    // ────────────────────────────────────────────────────────────────────────
    public GiftCard purchaseGiftCard(String purchaserId, Double amount) {
        String code = "FIQ-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        GiftCard card = GiftCard.builder()
                .code(code)
                .purchaserId(purchaserId)
                .initialAmount(amount)
                .balance(amount)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .expiryAt(LocalDateTime.now().plusYears(1))
                .build();

        return giftCardRepository.save(card);
    }

    public GiftCard redeemGiftCard(String code, String receiverId) {
        GiftCard card = giftCardRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid Gift Card code"));

        if (!"ACTIVE".equalsIgnoreCase(card.getStatus())) {
            throw new RuntimeException("Gift Card is already redeemed or expired");
        }
        if (LocalDateTime.now().isAfter(card.getExpiryAt())) {
            card.setStatus("EXPIRED");
            giftCardRepository.save(card);
            throw new RuntimeException("Gift Card has expired");
        }

        card.setStatus("REDEEMED");
        card.setReceiverId(receiverId);
        card.setRedeemedAt(LocalDateTime.now());
        card.setBalance(0.0);
        giftCardRepository.save(card);

        // Credit receiver wallet balance
        walletService.addCoins(Long.parseLong(receiverId), card.getInitialAmount());
        recordWalletLedger(receiverId, "CUSTOMER", card.getInitialAmount(), "CREDIT", "GIFT_CARD", 
                           "Redeemed gift card: " + code);

        return card;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. INVOICE GENERATOR & TAX CALCULATOR
    // ────────────────────────────────────────────────────────────────────────
    private void generateInvoice(Transaction t) {
        double subtotal = t.getAmount() - t.getWalletDeductionAmount();
        double cgst = Math.round((subtotal * 0.025) * 100.0) / 100.0;
        double sgst = Math.round((subtotal * 0.025) * 100.0) / 100.0;

        Invoice invoice = Invoice.builder()
                .invoiceNumber("FIQ_INV_" + System.currentTimeMillis())
                .orderId(t.getOrderId())
                .customerId(t.getCustomerId())
                .restaurantId(t.getRestaurantId())
                .type("CUSTOMER")
                .totalAmount(t.getAmount())
                .cgst(cgst)
                .sgst(sgst)
                .igst(0.0)
                .deliveryCharges(40.0)
                .platformFee(5.0)
                .discount(0.0)
                .finalPaidAmount(t.getAmount())
                .items(List.of(
                    Invoice.InvoiceItem.builder()
                        .description("Food Items Subtotal")
                        .quantity(1)
                        .unitPrice(subtotal)
                        .taxAmount(cgst + sgst)
                        .totalAmount(t.getAmount())
                        .build()
                ))
                .timestamp(LocalDateTime.now())
                .build();

        invoiceRepository.save(invoice);
    }

    private void generateRefundInvoice(Refund r) {
        Invoice invoice = Invoice.builder()
                .invoiceNumber("REF_INV_" + System.currentTimeMillis())
                .orderId(r.getOrderId())
                .customerId("SYSTEM")
                .type("REFUND")
                .totalAmount(r.getAmount())
                .cgst(0.0)
                .sgst(0.0)
                .igst(0.0)
                .finalPaidAmount(-r.getAmount())
                .items(List.of(
                    Invoice.InvoiceItem.builder()
                        .description("Credit Note for Refund")
                        .quantity(1)
                        .unitPrice(-r.getAmount())
                        .taxAmount(0.0)
                        .totalAmount(-r.getAmount())
                        .build()
                ))
                .timestamp(LocalDateTime.now())
                .build();

        invoiceRepository.save(invoice);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 8. TELEMETRY, CASHBACKS & AUDITING UTILS
    // ────────────────────────────────────────────────────────────────────────
    private void recordWalletLedger(String userId, String role, Double amount, String type, String source, String desc) {
        WalletTransaction transaction = WalletTransaction.builder()
                .userId(userId)
                .userRole(role)
                .amount(amount)
                .type(type)
                .source(source)
                .description(desc)
                .timestamp(LocalDateTime.now())
                .build();
        walletTransactionRepository.save(transaction);
    }

    private void applyEarnedCashback(String customerId, Double amount) {
        // Query active cashback campaigns
        List<CashbackCampaign> campaigns = cashbackCampaignRepository.findByActive(true);
        if (campaigns.isEmpty()) return;

        CashbackCampaign active = campaigns.get(0);
        if (amount >= active.getMinOrderAmount()) {
            double earned = Math.min(amount * active.getCashbackPercentage() / 100.0, active.getMaxCashbackAmount());
            if (earned > 0) {
                walletService.addCoins(Long.parseLong(customerId), earned);
                recordWalletLedger(customerId, "CUSTOMER", earned, "CREDIT", "CASHBACK", 
                                   "Earned from: " + active.getName());
                log.info("Applied {} cashback for customer: {}", earned, customerId);
            }
        }
    }

    private void detectFraudVelocity(String customerId) {
        // Look up last 5 transactions of customer in past 10 minutes
        List<Transaction> userTxns = transactionRepository.findByCustomerId(customerId);
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(10);
        
        long count = userTxns.stream()
                .filter(t -> t.getTimestamp().isAfter(threshold))
                .count();

        if (count > 5) {
            log.warn("Velocity attack detected for user: {}. Triggering system alert.", customerId);
            throw new RuntimeException("Transaction rate limit exceeded. Please try again in 10 minutes.");
        }
    }

    // Notification Integration Hooks
    private void sendPaymentAlert(String customerId, String orderId, Double amount, boolean success, String error) {
        try {
            NotificationRequest req = NotificationRequest.builder()
                    .userId(customerId)
                    .event(success ? "PAYMENT_SUCCESS" : "PAYMENT_FAILURE")
                    .type(success ? "SUCCESS" : "ERROR")
                    .variables(Map.of(
                        "orderId", orderId,
                        "amount", String.valueOf(amount),
                        "reason", error != null ? error : ""
                    ))
                    .build();
            notificationService.sendNotification(req);
        } catch (Exception e) {
            log.warn("Could not dispatch payment notification alert: {}", e.getMessage());
        }
    }

    private void triggerRefundNotification(String customerId, String orderId, Double amount, boolean success) {
        try {
            NotificationRequest req = NotificationRequest.builder()
                    .userId(customerId)
                    .event(success ? "REFUND_SUCCESS" : "REFUND_FAILURE")
                    .type(success ? "SUCCESS" : "ERROR")
                    .variables(Map.of(
                        "orderId", orderId,
                        "amount", String.valueOf(amount)
                    ))
                    .build();
            notificationService.sendNotification(req);
        } catch (Exception e) {
            log.warn("Could not dispatch refund notification alert: {}", e.getMessage());
        }
    }

    public Map<String, Object> getFinancialAnalytics() {
        List<Transaction> txns = transactionRepository.findAll();
        double totalRevenue = 0.0;
        int completedCount = 0;
        int failedCount = 0;

        for (Transaction t : txns) {
            if ("COMPLETED".equals(t.getStatus())) {
                totalRevenue += t.getAmount();
                completedCount++;
            } else if ("FAILED".equals(t.getStatus())) {
                failedCount++;
            }
        }

        int total = completedCount + failedCount;
        double successRate = total > 0 ? (completedCount * 100.0 / total) : 100.0;
        double failureRate = total > 0 ? (failedCount * 100.0 / total) : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("revenue", totalRevenue);
        metrics.put("successRate", String.format("%.1f%%", successRate));
        metrics.put("failureRate", String.format("%.1f%%", failureRate));
        metrics.put("transactionCount", completedCount);
        metrics.put("refundRate", "1.2%");
        metrics.put("averageValue", completedCount > 0 ? (totalRevenue / completedCount) : 0.0);
        return metrics;
    }
}
