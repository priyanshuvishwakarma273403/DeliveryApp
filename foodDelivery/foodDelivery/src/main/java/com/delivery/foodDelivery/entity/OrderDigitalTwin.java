package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_digital_twins", indexes = {
    @Index(name = "idx_odt_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDigitalTwin extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "restaurant_status")
    private String restaurantStatus;

    @Column(name = "kitchen_progress")
    private Double kitchenProgress;

    @Column(name = "predicted_food_ready_at")
    private LocalDateTime predictedFoodReadyAt;

    @Column(name = "rider_status")
    private String riderStatus;

    @Column(name = "predicted_pickup_at")
    private LocalDateTime predictedPickupAt;

    @Column(name = "predicted_delivery_at")
    private LocalDateTime predictedDeliveryAt;

    @Column(name = "sla_risk")
    private String slaRisk;

    @Column(name = "delay_risk")
    private String delayRisk;

    @Column(name = "inventory_risk")
    private String inventoryRisk;

    @Column(name = "overall_health")
    private String overallHealth;

    private LocalDateTime timestamp;
}
