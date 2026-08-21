package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_recovery_actions", indexes = {
    @Index(name = "idx_recovery_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryRecoveryAction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "action_type")
    private String actionType; // REASSIGN_RIDER, COMPENSATE, etc.

    @Column(columnDefinition = "TEXT")
    private String reason;

    private String status; // TRIGGERED, COMPLETED, FAILED

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson; // Detail details
}
