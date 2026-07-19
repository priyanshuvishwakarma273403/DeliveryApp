package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "fraud_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudCase {

    @Id
    private String id;

    @Indexed
    private String entityId; // userId, restaurantId, or driverId

    private String entityType; // "USER", "RESTAURANT", "DRIVER"

    @Builder.Default
    private Double riskScore = 0.0; // 0.0 to 100.0

    @Builder.Default
    private String status = "OPEN"; // OPEN, UNDER_INVESTIGATION, RESOLVED_BLOCKED, RESOLVED_CLEARED

    private String assignedInvestigator;

    @Builder.Default
    private List<String> notes = new ArrayList<>();

    @Builder.Default
    private List<String> timeline = new ArrayList<>(); // Event strings with timestamps

    @Builder.Default
    private Map<String, String> deviceFingerprint = new HashMap<>(); // Device ID, OS, Browser, Timezone

    @Builder.Default
    private Map<String, String> locationSecurity = new HashMap<>(); // IP, VPN status, impossible travel

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
