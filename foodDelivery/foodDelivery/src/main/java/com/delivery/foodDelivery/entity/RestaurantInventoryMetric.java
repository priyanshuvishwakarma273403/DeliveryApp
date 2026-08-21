package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_inventory_metrics", indexes = {
    @Index(name = "idx_inventory_rest_ts", columnList = "restaurant_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantInventoryMetric extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "ingredient_name", nullable = false)
    private String ingredientName; // CHICKEN, RICE, PANEER, MUSHROOM, etc.

    @Column(name = "current_quantity")
    private Double currentQuantity;

    @Column(name = "reserved_quantity")
    private Double reservedQuantity;

    @Column(name = "available_quantity")
    private Double availableQuantity;

    private String unit; // KG, L, PCS

    @Column(name = "reorder_threshold")
    private Double reorderThreshold;

    @Column(name = "average_consumption_rate")
    private Double averageConsumptionRate; // per hour

    @Column(name = "predicted_consumption_rate")
    private Double predictedConsumptionRate; // per hour

    @Column(name = "estimated_stockout_minutes")
    private Integer estimatedStockoutMinutes;

    @Column(name = "supplier_info")
    private String supplierInfo;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
