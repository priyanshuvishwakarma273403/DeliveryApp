package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.OrderRisk;
import com.delivery.foodDelivery.repository.jpa.OrderRiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIExplanationEngine {

    private final OrderRiskRepository riskRepository;

    public String explainOrderState(Long orderId) {
        log.info("Generating AI grounded explanation for order {}", orderId);
        List<OrderRisk> activeRisks = riskRepository.findByOrderIdAndStatus(orderId, "ACTIVE");

        if (activeRisks.isEmpty()) {
            return "Your order is currently on track with no detected operational delays.";
        }

        // Grounding checks
        StringBuilder explanation = new StringBuilder();
        explanation.append("FoodIQ Copilot Diagnostic:\n");

        for (OrderRisk risk : activeRisks) {
            switch (risk.getType().toUpperCase()) {
                case "RESTAURANT_REJECTION":
                    explanation.append("- The restaurant was unable to accept your order because they are currently at peak capacity.\n");
                    break;
                case "KITCHEN_OVERLOAD":
                    explanation.append(String.format("- Preparation is delayed: %s\n", risk.getEvidence()));
                    break;
                case "ITEM_UNAVAILABLE":
                    explanation.append(String.format("- Out of Stock: %s\n", risk.getEvidence()));
                    break;
                case "RIDER_UNAVAILABLE":
                    explanation.append("- Courier dispatch is taking longer than expected due to high demand in your delivery zone.\n");
                    break;
                case "DELIVER_DELAY":
                    explanation.append(String.format("- Delivery route delay: %s\n", risk.getEvidence()));
                    break;
                case "PAYMENT_FAILURE":
                    explanation.append("- The payment transaction could not be authorized by your bank.\n");
                    break;
                default:
                    explanation.append(String.format("- Operational flag: %s.\n", risk.getEvidence()));
                    break;
            }
        }

        return explanation.toString();
    }
}
