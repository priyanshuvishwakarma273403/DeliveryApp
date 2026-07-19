package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "fraud_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudRule {

    @Id
    private String id;

    private String name;

    private String description;

    private String ruleField; // e.g. "refunds_24h", "failed_payments_24h", "coupon_attempts_24h", "vpn_used"

    private String operator; // e.g. "GREATER_THAN", "EQUALS", "TRUE"

    private String thresholdValue; // e.g. "5", "3", "true"

    private String actionToTrigger; // e.g. "REQUIRE_OTP", "FREEZE_WALLET", "SUSPEND_ACCOUNT", "BLOCK_COUPON"

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private Integer priority = 1;
}
