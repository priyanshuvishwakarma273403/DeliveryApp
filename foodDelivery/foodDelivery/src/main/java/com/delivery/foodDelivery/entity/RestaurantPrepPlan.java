package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_prep_plans", indexes = {
    @Index(name = "idx_prep_plan_rest_status", columnList = "restaurant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantPrepPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(name = "menu_item_id", nullable = false)
    private String menuItemId;

    @Column(name = "menu_item_name", nullable = false)
    private String menuItemName;

    @Column(name = "predicted_demand")
    private Integer predictedDemand;

    @Column(name = "current_prep")
    private Integer currentPrep;

    @Column(name = "recommended_prep")
    private Integer recommendedPrep;

    private String priority; // HIGH, MEDIUM, LOW

    private String reason;

    private String status; // PENDING, APPROVED, REJECTED, EDITED

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
}
