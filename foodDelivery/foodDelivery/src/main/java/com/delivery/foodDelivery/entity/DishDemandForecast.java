package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dish_demand_forecasts", indexes = {
    @Index(name = "idx_dish_forecast_rest_ts", columnList = "restaurant_id, generated_at"),
    @Index(name = "idx_dish_forecast_item", columnList = "menu_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DishDemandForecast extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "menu_item_id", nullable = false)
    private String menuItemId;

    @Column(name = "menu_item_name", nullable = false)
    private String menuItemName;

    @Column(name = "current_demand")
    private Integer currentDemand;

    @Column(name = "predicted_demand")
    private Integer predictedDemand;

    private Double confidence;

    private String trend; // INCREASING, DECREASING, STABLE

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
}
