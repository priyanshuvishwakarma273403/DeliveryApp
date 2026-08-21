package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_digital_twins", indexes = {
    @Index(name = "idx_kdt_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenDigitalTwin extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false, unique = true)
    private String restaurantId;

    private LocalDateTime timestamp;

    @Column(name = "active_orders")
    private Integer activeOrders;

    @Column(name = "queued_orders")
    private Integer queuedOrders;

    @Column(name = "preparing_orders")
    private Integer preparingOrders;

    @Column(name = "ready_orders")
    private Integer readyOrders;

    @Column(name = "overall_load")
    private Double overallLoad; // e.g. 0.82

    @Column(name = "bottleneck_station")
    private String bottleneckStation;

    @Column(name = "predicted_load_15_min")
    private Double predictedLoad15Min;

    @Column(name = "delay_risk")
    private String delayRisk; // LOW, MEDIUM, HIGH

    @Column(name = "estimated_backlog_clear_time")
    private String estimatedBacklogClearTime; // e.g. "18 minutes"
}
