package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_taste_history", indexes = {
    @Index(name = "idx_user_history", columnList = "user_id, version")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTasteHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "changed_dimension_type")
    private String changedDimensionType;

    @Column(name = "changed_dimension_key")
    private String changedDimensionKey;

    @Column(name = "old_value")
    private Double oldValue;

    @Column(name = "new_value")
    private Double newValue;

    @Column(name = "source_event_id")
    private String sourceEventId;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
