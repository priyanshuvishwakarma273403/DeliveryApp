package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.OrderDigitalTwin;
import com.delivery.foodDelivery.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderHealthEngine {

    public String determineOverallHealth(Order order, OrderDigitalTwin twin, boolean activeRecovery) {
        if (order.getStatus() == OrderStatus.DELIVERED) {
            return "COMPLETED";
        }
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REJECTED 
                || order.getStatus() == OrderStatus.RESTAURANT_CANCELLED || order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            return "CANCELLED";
        }

        if (activeRecovery) {
            return "RECOVERY_IN_PROGRESS";
        }

        String slaRisk = twin.getSlaRisk();
        String delayRisk = twin.getDelayRisk();
        String inventoryRisk = twin.getInventoryRisk();

        if ("CRITICAL".equalsIgnoreCase(slaRisk) || "CRITICAL".equalsIgnoreCase(delayRisk)) {
            return "CRITICAL";
        }

        if ("HIGH".equalsIgnoreCase(slaRisk) || "HIGH".equalsIgnoreCase(delayRisk) || "HIGH".equalsIgnoreCase(inventoryRisk)) {
            return "AT_RISK";
        }

        if ("MEDIUM".equalsIgnoreCase(slaRisk) || "MEDIUM".equalsIgnoreCase(delayRisk)) {
            return "WATCH";
        }

        // Check if ETA is already past current time significantly
        if (twin.getPredictedDeliveryAt() != null && twin.getPredictedDeliveryAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            return "DELAYED";
        }

        return "HEALTHY";
    }
}
