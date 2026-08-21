package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.OrderDigitalTwin;
import com.delivery.foodDelivery.entity.OrderRisk;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.enums.PaymentStatus;
import com.delivery.foodDelivery.repository.jpa.OrderRiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderRiskEngine {

    private final OrderRiskRepository riskRepository;

    @Transactional
    public List<OrderRisk> evaluateRisks(Order order, OrderDigitalTwin twin) {
        log.info("Evaluating risks for orderId={}", order.getId());
        List<OrderRisk> activeRisks = new ArrayList<>();

        // 1. Restaurant Rejection Risk
        if (order.getStatus() == OrderStatus.REJECTED || order.getStatus() == OrderStatus.RESTAURANT_CANCELLED) {
            activeRisks.add(createOrGetRisk(order.getId(), "RESTAURANT_REJECTION", "CRITICAL", 
                    "Order rejected by the restaurant.", "RESTAURANT_PORTAL", 25));
        }

        // 2. Restaurant Delay Risk (Pending acceptance for too long)
        if (order.getStatus() == OrderStatus.RESTAURANT_PENDING && 
                order.getCreatedDate().isBefore(LocalDateTime.now().minusMinutes(5))) {
            activeRisks.add(createOrGetRisk(order.getId(), "RESTAURANT_DELAY", "HIGH", 
                    "Restaurant pending acceptance for more than 5 minutes.", "RESTAURANT_PORTAL", 10));
        }

        // 3. Kitchen Overload
        if (twin.getKitchenProgress() != null && twin.getKitchenProgress() < 0.3 && 
                order.getStatus() == OrderStatus.KITCHEN_PREPARING &&
                order.getCreatedDate().isBefore(LocalDateTime.now().minusMinutes(15))) {
            activeRisks.add(createOrGetRisk(order.getId(), "KITCHEN_OVERLOAD", "MEDIUM", 
                    "Kitchen preparation time is exceeding normal thresholds.", "KITCHEN_INTELLIGENCE", 8));
        }

        // 4. Rider Unavailability (Food ready but no rider assigned for too long)
        if (order.getStatus() == OrderStatus.RIDER_ASSIGNMENT_PENDING && 
                order.getUpdatedDate().isBefore(LocalDateTime.now().minusMinutes(5))) {
            activeRisks.add(createOrGetRisk(order.getId(), "RIDER_UNAVAILABLE", "HIGH", 
                    "Rider assignment pending for over 5 minutes.", "DISPATCH_ENGINE", 12));
        }

        // 5. Payment Failure
        if (order.getPaymentStatus() == PaymentStatus.FAILED) {
            activeRisks.add(createOrGetRisk(order.getId(), "PAYMENT_FAILURE", "CRITICAL", 
                    "Payment transaction failed.", "PAYMENT_GATEWAY", 0));
        }

        // 6. Delivery SLA Delay
        if (twin.getPredictedDeliveryAt() != null) {
            LocalDateTime slaDeadline = order.getCreatedDate().plusMinutes(40); // 40-minute SLA policy
            if (twin.getPredictedDeliveryAt().isAfter(slaDeadline.plusMinutes(15))) {
                activeRisks.add(createOrGetRisk(order.getId(), "DELIVER_DELAY", "CRITICAL", 
                        "Predicted delivery time is 15+ minutes past SLA.", "DELIVERY_INTELLIGENCE", 18));
            } else if (twin.getPredictedDeliveryAt().isAfter(slaDeadline.plusMinutes(5))) {
                activeRisks.add(createOrGetRisk(order.getId(), "DELIVER_DELAY", "HIGH", 
                        "Predicted delivery time is 5+ minutes past SLA.", "DELIVERY_INTELLIGENCE", 8));
            } else if (twin.getPredictedDeliveryAt().isAfter(slaDeadline)) {
                activeRisks.add(createOrGetRisk(order.getId(), "DELIVER_DELAY", "MEDIUM", 
                        "Predicted delivery time exceeds SLA.", "DELIVERY_INTELLIGENCE", 3));
            }
        }

        return activeRisks;
    }

    private OrderRisk createOrGetRisk(Long orderId, String type, String severity, String evidence, String source, int impactMinutes) {
        List<OrderRisk> existing = riskRepository.findByOrderIdAndStatus(orderId, "ACTIVE");
        for (OrderRisk r : existing) {
            if (r.getType().equalsIgnoreCase(type)) {
                return r; // already active
            }
        }

        OrderRisk risk = OrderRisk.builder()
                .riskId(UUID.randomUUID().toString())
                .orderId(orderId)
                .type(type)
                .severity(severity)
                .detectedAt(LocalDateTime.now())
                .source(source)
                .evidence(evidence)
                .estimatedImpactMinutes(impactMinutes)
                .status("ACTIVE")
                .build();
        return riskRepository.save(risk);
    }

    @Transactional
    public void resolveRisk(Long orderId, String type, String resolution) {
        List<OrderRisk> active = riskRepository.findByOrderIdAndStatus(orderId, "ACTIVE");
        for (OrderRisk r : active) {
            if (r.getType().equalsIgnoreCase(type)) {
                r.setStatus("RESOLVED");
                r.setResolvedAt(LocalDateTime.now());
                r.setResolution(resolution);
                riskRepository.save(r);
                log.info("Resolved risk {} on order {}", type, orderId);
            }
        }
    }
}
