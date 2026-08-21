package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_forecasts", indexes = {
    @Index(name = "idx_forecast_rest_ts", columnList = "restaurant_id, generated_at"),
    @Index(name = "idx_forecast_horizon", columnList = "horizon")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantForecast extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String horizon; // NEXT_15_MINUTES, NEXT_30_MINUTES, NEXT_60_MINUTES, NEXT_2_HOURS, NEXT_6_HOURS, NEXT_DAY, NEXT_7_DAYS

    @Column(name = "predicted_orders")
    private Integer predictedOrders;

    private Double confidence;

    private String trend; // INCREASING, DECREASING, STABLE

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "actual_observed_value")
    private Integer actualObservedValue;

    @Column(name = "prediction_error")
    private Double predictionError;
}
