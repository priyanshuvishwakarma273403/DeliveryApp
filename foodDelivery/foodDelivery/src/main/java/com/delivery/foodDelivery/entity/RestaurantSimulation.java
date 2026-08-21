package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_simulations", indexes = {
    @Index(name = "idx_simulation_rest_ts", columnList = "restaurant_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantSimulation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "order_increase")
    private Double orderIncrease;

    @Column(name = "staff_change")
    private Integer staffChange;

    @Column(name = "discount_applied")
    private Double discountApplied;

    @Column(name = "results_json", columnDefinition = "TEXT")
    private String resultsJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
