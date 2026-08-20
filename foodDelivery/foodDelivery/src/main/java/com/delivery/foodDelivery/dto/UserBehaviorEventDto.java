package com.delivery.foodDelivery.dto;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBehaviorEventDto {
    private String eventId;
    private String eventType;
    private Integer schemaVersion;
    private String userId; // can be "user-123" or similar
    private String timestamp; // ISO-8601 string
    private Map<String, Object> payload;
}
