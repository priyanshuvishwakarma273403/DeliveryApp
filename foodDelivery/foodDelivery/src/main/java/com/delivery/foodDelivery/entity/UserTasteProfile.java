package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "user_taste_profiles", indexes = {
    @Index(name = "idx_profile_user_id", columnList = "user_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTasteProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_taste_cuisines", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "cuisine")
    @Builder.Default
    private List<String> preferredCuisines = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_taste_categories", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "category")
    @Builder.Default
    private List<String> preferredCategories = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_taste_frequent_items", joinColumns = @JoinColumn(name = "profile_id"))
    @MapKeyColumn(name = "item_id")
    @Column(name = "count_val")
    @Builder.Default
    private Map<String, Integer> frequentItems = new HashMap<>(); // itemId -> count

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_taste_frequent_restaurants", joinColumns = @JoinColumn(name = "profile_id"))
    @MapKeyColumn(name = "restaurant_id")
    @Column(name = "count_val")
    @Builder.Default
    private Map<String, Integer> frequentRestaurants = new HashMap<>(); // restaurantId -> count

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_taste_dietary", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preference")
    @Builder.Default
    private List<String> dietaryPreferences = new ArrayList<>(); // VEGETARIAN, VEGAN, JAIN, GLUTEN_FREE, HIGH_PROTEIN, LOW_CARB

    @Column(name = "budget_tier")
    @Builder.Default
    private String budgetTier = "MEDIUM"; // BUDGET, MEDIUM, PREMIUM

    @Column(name = "average_rating_given")
    private Double averageRatingGiven;

    @Column(name = "average_order_value")
    private Double averageOrderValue;

    @Column(name = "min_price")
    private Double minPrice;

    @Column(name = "max_price")
    private Double maxPrice;

    @Column(name = "maximum_preferred_minutes")
    private Integer maximumPreferredMinutes;

    @Column(name = "exploration_score")
    private Double explorationScore;

    @Column(name = "version")
    @Builder.Default
    private Long version = 1L;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
