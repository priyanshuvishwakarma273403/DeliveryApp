package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_recovery_audits", indexes = {
    @Index(name = "idx_ora_audit_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRecoveryAudit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_id", nullable = false)
    private String actionId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "risk_id")
    private String riskId;

    private String action;

    @Column(name = "initiated_by")
    private String initiatedBy;

    @Column(name = "automation_level")
    private String automationLevel;

    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(name = "previous_state")
    private String previousState;

    @Column(name = "new_state")
    private String newState;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "correlation_id")
    private String correlationId;
}
