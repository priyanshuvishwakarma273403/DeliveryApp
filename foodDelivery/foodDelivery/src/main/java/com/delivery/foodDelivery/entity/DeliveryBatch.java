package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryBatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_id")
    private Long riderId;

    @Column(name = "orders_json", columnDefinition = "TEXT")
    private String ordersJson; // JSON array of Order IDs

    private String status; // ACTIVE, COMPLETED, CANCELLED

    @Column(name = "estimated_completion_time")
    private LocalDateTime estimatedCompletionTime;

    private String risk; // SAFE, WARNING, CRITICAL
}
