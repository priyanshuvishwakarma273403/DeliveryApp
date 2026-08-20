package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_taste_dimensions", indexes = {
    @Index(name = "idx_user_dim_key", columnList = "user_id, dimension_type, dimension_key"),
    @Index(name = "idx_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTasteDimension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "dimension_type", nullable = false)
    private String dimensionType; // CUISINE, DISH, FLAVOR, DIETARY, TIME_OF_DAY, WEATHER, RESTAURANT, CATEGORY

    @Column(name = "dimension_key", nullable = false)
    private String dimensionKey;

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
