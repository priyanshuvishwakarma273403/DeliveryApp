package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_feedback", indexes = {
    @Index(name = "idx_rec_feed_user", columnList = "user_id, item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Column(name = "item_type", nullable = false)
    private String itemType; // RESTAURANT or DISH

    @Column(name = "action_type", nullable = false)
    private String actionType; // LIKE, DISLIKE, NOT_INTERESTED, ALREADY_TRIED, CLICKED, ADDED_TO_CART

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
