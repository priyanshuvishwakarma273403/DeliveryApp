package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_kitchen_metrics", indexes = {
    @Index(name = "idx_kitchen_rest_ts", columnList = "restaurant_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantKitchenMetric extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "station_name", nullable = false)
    private String stationName; // GRILL, FRY, OVEN, PACKING, etc.

    private Integer capacity;

    @Column(name = "active_orders")
    private Integer activeOrders;

    private Double utilization; // 0.0 to 1.0

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
