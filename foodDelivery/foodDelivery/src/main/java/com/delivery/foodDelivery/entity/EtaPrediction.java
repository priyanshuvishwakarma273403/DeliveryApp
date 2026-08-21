package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "eta_predictions", indexes = {
    @Index(name = "idx_eta_order_id", columnList = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtaPrediction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "predicted_eta_minutes")
    private Integer predictedEtaMinutes;

    @Column(name = "predicted_at")
    private LocalDateTime predictedAt;

    private Double confidence;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "feature_version")
    private String featureVersion;

    private String status; // Status of the order when predicted

    @Column(name = "actual_delivery_time_minutes")
    private Integer actualDeliveryTimeMinutes;
}
