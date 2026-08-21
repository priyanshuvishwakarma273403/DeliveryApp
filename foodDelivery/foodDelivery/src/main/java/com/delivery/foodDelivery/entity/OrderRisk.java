package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_risks", indexes = {
    @Index(name = "idx_or_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRisk extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "risk_id", nullable = false, unique = true)
    private String riskId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    private String type;

    private String severity;

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;

    private String source;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "estimated_impact_minutes")
    private Integer estimatedImpactMinutes;

    private String status;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    private String resolution;
}
