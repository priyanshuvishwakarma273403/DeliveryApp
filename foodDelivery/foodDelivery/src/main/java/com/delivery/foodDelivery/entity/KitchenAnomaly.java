package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_anomalies", indexes = {
    @Index(name = "idx_anomaly_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenAnomaly extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "anomaly_type", nullable = false)
    private String anomalyType; // e.g. PREP_TIME_SURGE, UNUSUAL_QUEUE_GROWTH

    private String description;

    private String severity; // LOW, MEDIUM, HIGH

    private String evidence;

    @Column(name = "observed_at")
    private LocalDateTime observedAt;

    @Column(name = "affected_station")
    private String affectedStation;

    @Column(name = "affected_orders")
    private String affectedOrders; // Comma-separated order IDs
}
