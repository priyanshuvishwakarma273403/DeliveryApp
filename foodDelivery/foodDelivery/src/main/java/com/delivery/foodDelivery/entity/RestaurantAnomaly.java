package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_anomalies", indexes = {
    @Index(name = "idx_anomaly_rest_ts", columnList = "restaurant_id, detected_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantAnomaly extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "anomaly_type", nullable = false)
    private String anomalyType; // DEMAND_DROP_ANOMALY, PREP_TIME_ANOMALY, etc.

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "metric_name")
    private String metricName;

    @Column(name = "expected_value")
    private Double expectedValue;

    @Column(name = "actual_value")
    private Double actualValue;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "potential_causes", columnDefinition = "TEXT")
    private String potentialCauses;
}
