package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_risk_events", indexes = {
    @Index(name = "idx_risk_rest_status", columnList = "restaurant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantRiskEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "risk_type", nullable = false)
    private String riskType; // DEMAND_SPIKE, KITCHEN_BOTTLENECK, INVENTORY_STOCKOUT_RISK, etc.

    @Column(nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "affected_area")
    private String affectedArea; // KITCHEN, INVENTORY, STAFF, SLA, etc.

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(nullable = false)
    private String status; // ACTIVE, RESOLVED
}
