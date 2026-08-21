package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_tasks", indexes = {
    @Index(name = "idx_task_order_id", columnList = "order_id"),
    @Index(name = "idx_task_station_id", columnList = "station_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenTask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false, unique = true)
    private String taskId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "dish_id", nullable = false)
    private String dishId;

    @Column(name = "station_id", nullable = false)
    private String stationId; // station name or stationId

    @Column(nullable = false)
    private String status; // PENDING, PREPARING, COMPLETED, CANCELLED

    @Column(name = "estimated_duration")
    private Double estimatedDuration; // in minutes

    @Column(name = "actual_duration")
    private Double actualDuration; // in minutes

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
