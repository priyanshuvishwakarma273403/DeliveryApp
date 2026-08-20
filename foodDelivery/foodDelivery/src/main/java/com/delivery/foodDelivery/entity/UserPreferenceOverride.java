package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preference_overrides", indexes = {
    @Index(name = "idx_user_pref_key", columnList = "user_id, preference_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferenceOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "preference_key", nullable = false)
    private String preferenceKey; // e.g. "EXCLUDED_INGREDIENT", "DIETARY_PREF", "SPICE_LEVEL", "FAVORITE_CUISINES", "BUDGET_LIMIT"

    @Column(name = "preference_value", nullable = false)
    private String preferenceValue;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
