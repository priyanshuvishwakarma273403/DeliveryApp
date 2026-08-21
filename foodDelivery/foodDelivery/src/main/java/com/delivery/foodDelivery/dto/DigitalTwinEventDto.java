package com.delivery.foodDelivery.dto;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DigitalTwinEventDto {
    private String eventId;
    private String eventType;
    private Integer schemaVersion;
    private String timestamp;
    private String restaurantId;
    private Long orderId;
    private String correlationId;

    private String source;
    private Map<String, Object> payload;
}
