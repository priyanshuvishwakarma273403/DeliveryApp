package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.enums.PaymentStatus;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderOrchestrator {

    private final OrderStateManager orderStateManager;
    private final OrderLockService lockService;
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;
    private final RiderAssignmentEngine riderAssignmentEngine;
    private final ETAEngine etaEngine;
    private final DelayPredictionEngine delayPredictionEngine;
    private final RecoveryEngine recoveryEngine;
    private final DeliveryService deliveryService;

    @Async
    @Transactional
    public void handleOrderCreated(Long orderId) {
        String lockKey = "order:lock:" + orderId;
        if (!lockService.acquireLock(lockKey, 30)) {
            log.warn("Could not acquire lock for order {} - duplicate event?", orderId);
            return;
        }

        try {
            log.info("Orchestrating Order Created for order {}", orderId);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new BusinessException("Order not found: " + orderId));

            if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PLACED) {
                log.info("Order {} already in state {}, skipping Payment trigger", orderId, order.getStatus());
                return;
            }

            // Transition to PAYMENT_PENDING
            orderStateManager.transitionTo(orderId, OrderStatus.PAYMENT_PENDING, UUID.randomUUID().toString(), "ORCHESTRATOR");

            // Process simulated payment
            double total = order.getTotalAmount();
            var payment = paymentService.processPayment(
                    null, total, order.getPaymentMethod(), "mock-token-" + orderId);

            if (PaymentStatus.SUCCESS.name().equals(payment.getStatus())) {
                order.setPaymentStatus(PaymentStatus.SUCCESS);
                order.setPaymentId(payment.getPaymentId());
                orderRepository.save(order);

                // Transition to PAYMENT_CONFIRMED
                orderStateManager.transitionTo(orderId, OrderStatus.PAYMENT_CONFIRMED, UUID.randomUUID().toString(), "ORCHESTRATOR");
                
                // Trigger next step: route to restaurant
                handlePaymentConfirmed(orderId);
            } else {
                order.setPaymentStatus(PaymentStatus.FAILED);
                orderRepository.save(order);

                // Transition to PAYMENT_FAILED
                orderStateManager.transitionTo(orderId, OrderStatus.PAYMENT_FAILED, UUID.randomUUID().toString(), "ORCHESTRATOR");
            }
        } catch (Exception e) {
            log.error("Error in handleOrderCreated for order {}", orderId, e);
        } finally {
            lockService.releaseLock(lockKey);
        }
    }

    @Async
    @Transactional
    public void handlePaymentConfirmed(Long orderId) {
        String lockKey = "order:lock:" + orderId;
        if (!lockService.acquireLock(lockKey, 30)) {
            log.warn("Could not acquire lock for order {}", orderId);
            return;
        }

        try {
            log.info("Orchestrating Payment Confirmed for order {}", orderId);
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) return;

            // Transition to RESTAURANT_PENDING
            orderStateManager.transitionTo(orderId, OrderStatus.RESTAURANT_PENDING, UUID.randomUUID().toString(), "ORCHESTRATOR");

            // Simulate restaurant auto-acceptance after 2 seconds for hands-free flow
            // In production this would wait for a restaurant digital twin or owner accept webhook
            simulateRestaurantAcceptance(orderId);
        } catch (Exception e) {
            log.error("Error in handlePaymentConfirmed for order {}", orderId, e);
        } finally {
            lockService.releaseLock(lockKey);
        }
    }

    @Async
    @Transactional
    public void handleRestaurantAccepted(Long orderId) {
        String lockKey = "order:lock:" + orderId;
        if (!lockService.acquireLock(lockKey, 30)) {
            return;
        }

        try {
            log.info("Orchestrating Restaurant Accepted for order {}", orderId);
            // Transition to KITCHEN_PREPARING
            orderStateManager.transitionTo(orderId, OrderStatus.KITCHEN_PREPARING, UUID.randomUUID().toString(), "ORCHESTRATOR");

            // Start rider search & ranking in the background to warm up dispatch
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null) {
                riderAssignmentEngine.findAndRankRiders(order, 15, false);
            }

            // Simulate kitchen preparing finishing in 5 seconds
            simulateKitchenReady(orderId);
        } catch (Exception e) {
            log.error("Error in handleRestaurantAccepted for order {}", orderId, e);
        } finally {
            lockService.releaseLock(lockKey);
        }
    }

    @Async
    @Transactional
    public void handleKitchenReady(Long orderId) {
        String lockKey = "order:lock:" + orderId;
        if (!lockService.acquireLock(lockKey, 30)) {
            return;
        }

        try {
            log.info("Orchestrating Kitchen Ready (Food Ready) for order {}", orderId);
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) return;

            // Transition to FOOD_READY -> RIDER_ASSIGNMENT_PENDING
            orderStateManager.transitionTo(orderId, OrderStatus.FOOD_READY, UUID.randomUUID().toString(), "ORCHESTRATOR");
            orderStateManager.transitionTo(orderId, OrderStatus.RIDER_ASSIGNMENT_PENDING, UUID.randomUUID().toString(), "ORCHESTRATOR");

            // 1. Dynamic ETA recalculation
            var eta = etaEngine.calculateAndRecordETA(order, null, "ORCHESTRATOR");

            // 2. Delay SLA check
            var delayFactors = DelayPredictionEngine.MapFactors.builder()
                    .kitchenBacklog(false)
                    .highTraffic(false)
                    .badWeather(false)
                    .riderUnavailable(false)
                    .build();
            var delayResult = delayPredictionEngine.predictDelay(order, eta.getEstimatedDeliveryTimeMinutes(), delayFactors);

            boolean isSlaCritical = "CRITICAL".equalsIgnoreCase(delayResult.getRiskLevel()) || "HIGH".equalsIgnoreCase(delayResult.getRiskLevel());

            // 3. Find and assign the top-ranked available rider
            var rankedRiders = riderAssignmentEngine.findAndRankRiders(order, eta.getEstimatedDeliveryTimeMinutes(), isSlaCritical);
            if (!rankedRiders.isEmpty()) {
                DeliveryPartner bestRider = rankedRiders.get(0).getPartner();
                log.info("Automatically assigning rider {} with score {} to order {}", 
                        bestRider.getId(), rankedRiders.get(0).getScore(), orderId);
                
                deliveryService.assignDeliveryPartner(orderId, bestRider.getId());
                
                // Transition to RIDER_ASSIGNED
                orderStateManager.transitionTo(orderId, OrderStatus.RIDER_ASSIGNED, UUID.randomUUID().toString(), "ORCHESTRATOR");
            } else {
                log.warn("No available riders found to assign to order {}", orderId);
                // Trigger recovery for rider unavailability
                recoveryEngine.triggerRecovery(order, "HIGH", 0.85, delayResult.getPredictedDelayMinutes(), "NO_RIDERS_AVAILABLE");
            }

            // 4. Trigger recovery actions if delay risk is detected
            if (delayResult.getPredictedDelayMinutes() > 0) {
                recoveryEngine.triggerRecovery(order, delayResult.getRiskLevel(), delayResult.getProbability(), 
                        delayResult.getPredictedDelayMinutes(), String.join(",", delayResult.getReasons()));
            }
        } catch (Exception e) {
            log.error("Error in handleKitchenReady for order {}", orderId, e);
        } finally {
            lockService.releaseLock(lockKey);
        }
    }

    private void simulateRestaurantAcceptance(Long orderId) {
        new Thread(() -> {
            try {
                Thread.sleep(1000);
                orderStateManager.transitionTo(orderId, OrderStatus.RESTAURANT_ACCEPTED, UUID.randomUUID().toString(), "SIMULATOR");
                handleRestaurantAccepted(orderId);
            } catch (Exception ignored) {}
        }).start();
    }

    private void simulateKitchenReady(Long orderId) {
        new Thread(() -> {
            try {
                Thread.sleep(2000);
                handleKitchenReady(orderId);
            } catch (Exception ignored) {}
        }).start();
    }
}
