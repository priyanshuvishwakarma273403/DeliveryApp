package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.CustomerRecoveryPreference;
import com.delivery.foodDelivery.entity.OrderRisk;
import com.delivery.foodDelivery.entity.RecoveryPolicy;
import com.delivery.foodDelivery.repository.jpa.CustomerRecoveryPreferenceRepository;
import com.delivery.foodDelivery.repository.jpa.RecoveryPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecoveryPolicyEngine {

    private final RecoveryPolicyRepository policyRepository;
    private final CustomerRecoveryPreferenceRepository customerPreferenceRepository;

    public static class PolicyDecision {
        public String action;
        public String automationLevel;
        public boolean allowedByCustomer;

        public PolicyDecision(String action, String automationLevel, boolean allowedByCustomer) {
            this.action = action;
            this.automationLevel = automationLevel;
            this.allowedByCustomer = allowedByCustomer;
        }
    }

    public PolicyDecision evaluatePolicy(Long customerId, OrderRisk risk) {
        log.info("Evaluating recovery policy for riskType={} severity={}", risk.getType(), risk.getSeverity());

        // Default decisions
        String action = "RECALCULATE_ETA";
        String automationLevel = "AUTO_EXECUTE_LOW_RISK"; // default safety level

        // Query database configuration if present
        Optional<RecoveryPolicy> dbPolicy = policyRepository.findByRiskType(risk.getType()).stream()
                .filter(p -> p.getSeverityLevel().equalsIgnoreCase(risk.getSeverity()))
                .findFirst();

        if (dbPolicy.isPresent()) {
            action = dbPolicy.get().getActionToTake();
            automationLevel = dbPolicy.get().getAutomationLevel();
        } else {
            // Hard-coded default fallback rules
            switch (risk.getType().toUpperCase()) {
                case "RESTAURANT_REJECTION":
                    action = "OFFER_CANCELLATION";
                    automationLevel = "REQUIRE_APPROVAL";
                    break;
                case "ITEM_UNAVAILABLE":
                    action = "REQUEST_CUSTOMER_DECISION";
                    automationLevel = "REQUIRE_APPROVAL";
                    break;
                case "RIDER_UNAVAILABLE":
                    action = "RECOMMEND_RIDER_REASSIGNMENT";
                    automationLevel = "AUTO_EXECUTE_LOW_RISK";
                    break;
                case "PAYMENT_FAILURE":
                    action = "REQUEST_CUSTOMER_DECISION";
                    automationLevel = "REQUIRE_APPROVAL";
                    break;
                case "DELIVER_DELAY":
                    if ("CRITICAL".equalsIgnoreCase(risk.getSeverity())) {
                        action = "INITIATE_REFUND_FLOW";
                        automationLevel = "FINANCIAL_APPROVAL";
                    } else {
                        action = "RECALCULATE_ETA";
                        automationLevel = "AUTO_EXECUTE_LOW_RISK";
                    }
                    break;
                default:
                    action = "RECALCULATE_ETA";
                    automationLevel = "AUTO_EXECUTE_LOW_RISK";
                    break;
            }
        }

        // Consult customer preferences
        boolean allowedByCustomer = true;
        Optional<CustomerRecoveryPreference> customerPref = customerPreferenceRepository.findByCustomerId(customerId);
        if (customerPref.isPresent()) {
            CustomerRecoveryPreference pref = customerPref.get();
            if (risk.getType().equalsIgnoreCase("ITEM_UNAVAILABLE")) {
                if (pref.isAskEveryTime()) {
                    allowedByCustomer = false;
                } else if (pref.isAutoSubstituteSamePrice()) {
                    action = "OFFER_SUBSTITUTION";
                    automationLevel = "AUTO_EXECUTE_LOW_RISK";
                } else if (pref.isAutoRemoveItem()) {
                    action = "OFFER_CANCELLATION";
                    automationLevel = "AUTO_EXECUTE_LOW_RISK";
                }
            } else if (risk.getType().equalsIgnoreCase("DELIVER_DELAY")) {
                if (!pref.isAutoUpdateEta()) {
                    automationLevel = "REQUIRE_APPROVAL";
                }
            }
        }

        return new PolicyDecision(action, automationLevel, allowedByCustomer);
    }
}
