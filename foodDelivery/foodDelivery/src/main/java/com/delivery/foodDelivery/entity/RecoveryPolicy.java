package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recovery_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_name", nullable = false, unique = true)
    private String ruleName;

    @Column(name = "risk_type")
    private String riskType;

    @Column(name = "delay_threshold")
    private Integer delayThreshold;

    @Column(name = "severity_level")
    private String severityLevel;

    @Column(name = "action_to_take")
    private String actionToTake;

    @Column(name = "automation_level")
    private String automationLevel;
}
