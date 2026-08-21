package com.delivery.foodDelivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventEnvelope {
    private String eventId;
    private String eventType;
    @Builder.Default
    private Integer schemaVersion = 1;
    private Long orderId;
    private String restaurantId;
    private Long customerId;
    private Long riderId;
    private String correlationId;
    private Long timestamp;
    private String source;
    private Map<String, Object> payload;
}
