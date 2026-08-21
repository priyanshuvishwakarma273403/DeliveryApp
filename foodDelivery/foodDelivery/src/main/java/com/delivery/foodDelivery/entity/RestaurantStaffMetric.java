package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_staff_metrics", indexes = {
    @Index(name = "idx_staff_rest_ts", columnList = "restaurant_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantStaffMetric extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "total_staff")
    private Integer totalStaff;

    @Column(name = "active_staff")
    private Integer activeStaff;

    @Column(name = "average_productivity")
    private Double averageProductivity; // orders per hour per staff

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
