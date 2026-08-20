package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recommendation_results", indexes = {
    @Index(name = "idx_rec_res_req", columnList = "request_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private String requestId;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Column(name = "item_type", nullable = false)
    private String itemType; // RESTAURANT or DISH

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "reason_codes")
    private String reasonCodes; // comma-separated codes, e.g. "SPICY_MATCH,WITHIN_BUDGET"

    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition;
}
