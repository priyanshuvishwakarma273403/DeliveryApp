package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rider_waiting_metrics", indexes = {
    @Index(name = "idx_rwm_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiderWaitingMetric extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "rider_arrival_at_restaurant")
    private LocalDateTime riderArrivalAtRestaurant;

    @Column(name = "food_ready_at")
    private LocalDateTime foodReadyAt;

    @Column(name = "pickup_at")
    private LocalDateTime pickupAt;

    @Column(name = "rider_waiting_time_minutes")
    private Double riderWaitingTimeMinutes;
}
