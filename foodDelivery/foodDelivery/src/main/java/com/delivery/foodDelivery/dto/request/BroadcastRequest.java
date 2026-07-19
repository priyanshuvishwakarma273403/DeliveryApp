package com.delivery.foodDelivery.dto.request;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BroadcastRequest {
    private String targetSegment; // "ALL", "CUSTOMERS", "RESTAURANTS", "DRIVERS"
    private String city;          // optional
    private String title;
    private String body;
    private String channel;       // e.g. "PUSH", "EMAIL", "SMS"
    private Map<String, String> variables;
}
