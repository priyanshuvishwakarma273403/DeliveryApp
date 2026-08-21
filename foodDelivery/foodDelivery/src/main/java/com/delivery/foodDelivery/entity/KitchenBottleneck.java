package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_bottlenecks", indexes = {
    @Index(name = "idx_bottleneck_restaurant_id", columnList = "restaurant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenBottleneck extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "station_id")
    private String stationId; // affected station

    private String severity; // HIGH, MEDIUM, LOW

    private String reason; // e.g. "Current queue exceeds station capacity."

    @Column(name = "estimated_impact_minutes")
    private Integer estimatedImpactMinutes; // delay added

    private String status; // ACTIVE, RESOLVED

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;
}
