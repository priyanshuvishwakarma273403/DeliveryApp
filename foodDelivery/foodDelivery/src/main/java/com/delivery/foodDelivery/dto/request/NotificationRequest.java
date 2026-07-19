package com.delivery.foodDelivery.dto.request;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {
    private String userId;
    private String event;       // e.g. "ORDER_PLACED"
    private String type;        // e.g. "SUCCESS", "WARNING", "INFORMATION", "ERROR", "CRITICAL", "TRANSACTIONAL", "MARKETING"
    private String channel;     // e.g. "IN_APP", "PUSH", "EMAIL", "SMS", "WHATSAPP" (null/empty means fallback to user preferences)
    private Map<String, String> variables; // Template variables: customerName, orderId, amount, otp, etc.
    private LocalDateTime scheduledTime; // For scheduled notifications
}
