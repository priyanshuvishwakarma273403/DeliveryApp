package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_stations", indexes = {
    @Index(name = "idx_station_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenStation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "station_id", nullable = false, unique = true)
    private String stationId;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status; // ACTIVE, MAINTENANCE, OFFLINE

    @Column(nullable = false)
    private Integer capacity; // Max parallel preparation tasks

    @Column(name = "current_load")
    private Double currentLoad;

    @Column(name = "queue_length")
    private Integer queueLength;

    @Column(name = "average_prep_time")
    private Double averagePrepTime;

    @Column(name = "estimated_available_at")
    private LocalDateTime estimatedAvailableAt;

    @Version
    private Long version;
}
