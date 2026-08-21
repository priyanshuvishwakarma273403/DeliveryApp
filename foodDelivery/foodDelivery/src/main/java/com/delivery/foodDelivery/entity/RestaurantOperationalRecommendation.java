package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_operational_recommendations", indexes = {
    @Index(name = "idx_reco_rest_status", columnList = "restaurant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantOperationalRecommendation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String action; // INCREASE_PREPARATION, TARGETED_PROMOTION, etc.

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "expected_impact")
    private String expectedImpact;

    private Double confidence;

    @Column(name = "required_action", columnDefinition = "TEXT")
    private String requiredAction;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String status; // RECOMMENDED, ACCEPTED, DISMISSED
}
