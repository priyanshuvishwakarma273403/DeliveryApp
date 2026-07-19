package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "fraud_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudAuditLog {

    @Id
    private String id;

    private String targetEntityId;

    private String targetEntityType; // USER, RESTAURANT, DRIVER

    private String eventType; // e.g. "VELOCITY_EXCEEDED", "VPN_DETECTED", "ORDER_BOMBING"

    private Double riskScoreEvaluated;

    private String triggeredRuleName;

    private String actionTaken; // e.g. "REQUIRE_OTP", "FREEZE_WALLET", "SUSPEND_ACCOUNT", "ALLOW"

    private String systemDecision; // "BLOCKED", "ALLOWED", "CHALLENGED"

    private String comment;

    private LocalDateTime timestamp;
}
