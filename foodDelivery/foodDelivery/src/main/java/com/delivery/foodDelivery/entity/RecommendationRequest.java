package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_requests", indexes = {
    @Index(name = "idx_rec_req_user", columnList = "user_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationRequest {

    @Id
    @Column(name = "request_id", nullable = false)
    private String requestId; // UUID

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "context_weather")
    private String contextWeather;

    @Column(name = "context_time_of_day")
    private String contextTimeOfDay;

    @Column(name = "context_meal")
    private String contextMeal;

    @Column(name = "context_location")
    private String contextLocation;

    @Column(name = "context_budget")
    private Double contextBudget;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
