package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_risk_events", indexes = {
    @Index(name = "idx_risk_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryRiskEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "risk_level")
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    private Double probability;

    @Column(name = "predicted_delay_minutes")
    private Integer predictedDelayMinutes;

    @Column(name = "reasons_json", columnDefinition = "TEXT")
    private String reasonsJson; // JSON array of reasons

    private String status; // ACTIVE, RESOLVED
}
