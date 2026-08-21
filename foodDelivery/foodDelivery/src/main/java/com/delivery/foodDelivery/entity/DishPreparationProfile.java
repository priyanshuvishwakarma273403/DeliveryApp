package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dish_preparation_profiles", indexes = {
    @Index(name = "idx_profile_dish_id", columnList = "dish_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DishPreparationProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dish_id", nullable = false, unique = true)
    private String dishId;

    @Column(name = "required_stations", nullable = false)
    private String requiredStations; // Comma-separated list of station types (e.g. "GRILL,ASSEMBLY,PACKAGING")

    @Column(name = "estimated_prep_time", nullable = false)
    private Double estimatedPrepTime; // in minutes

    @Column(name = "parallelizable_steps")
    private String parallelizableSteps; // Comma-separated steps that can run in parallel

    @Column(name = "sequential_steps")
    private String sequentialSteps; // Comma-separated steps that must run in sequence

    private Integer priority;

    @Column(name = "freshness_window")
    private Integer freshnessWindow; // in minutes (shelf-life after prepared)
}
