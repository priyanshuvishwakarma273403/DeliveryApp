package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_digital_twin_states", indexes = {
    @Index(name = "idx_dt_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantDigitalTwinState extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false, unique = true)
    private String restaurantId;

    private String status; // OPEN, CLOSED

    @Column(name = "active_orders")
    private Integer activeOrders;

    @Column(name = "orders_last_15_minutes")
    private Integer ordersLast15Minutes;

    @Column(name = "average_preparation_time")
    private Double averagePreparationTime;

    @Column(name = "kitchen_utilization")
    private Double kitchenUtilization;

    @Column(name = "staff_utilization")
    private Double staffUtilization;

    @Column(name = "inventory_risk")
    private String inventoryRisk; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "sla_risk")
    private Double slaRisk; // Probability (0.0 to 1.0)

    @Column(name = "predicted_orders_next_30_minutes")
    private Integer predictedOrdersNext30Minutes;

    @Column(name = "predicted_orders_next_60_minutes")
    private Integer predictedOrdersNext60Minutes;

    @Column(name = "health_score")
    private Integer healthScore; // 0 to 100

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
