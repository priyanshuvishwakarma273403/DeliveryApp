package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_operational_timelines", indexes = {
    @Index(name = "idx_oot_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderOperationalTimeline extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    private LocalDateTime timestamp;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "customer_visible")
    private boolean customerVisible;

    @Column(name = "correlation_id")
    private String correlationId;
}
