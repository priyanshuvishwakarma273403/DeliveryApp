package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "notification_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMessage {

    @Id
    private String id;

    private String userId;        // Target User ID (as a String for compatibility/index performance)
    private String event;         // e.g. "ORDER_PLACED", "SUSPICIOUS_LOGIN", "REWARD_EARNED"
    private String type;          // e.g. "SUCCESS", "WARNING", "INFORMATION", "ERROR", "CRITICAL", "MARKETING", "TRANSACTIONAL", "OPERATIONAL"
    private String channel;       // e.g. "IN_APP", "PUSH", "EMAIL", "SMS", "WHATSAPP"
    
    private String title;
    private String body;
    
    private String status;        // e.g. "QUEUED", "PROCESSING", "SENT", "DELIVERED", "READ", "FAILED", "RETRYING", "EXPIRED"
    private Long deliveryTimeMs;  // Delivery latency tracking
    
    private int retryCount;
    private int maxRetries;
    private String errorMessage;
    private Map<String, String> variables; // Template variable valuations
    
    private LocalDateTime scheduledTime;
    private LocalDateTime timestamp;

    // Inbox User view options
    @Builder.Default
    private boolean isRead = false;
    
    @Builder.Default
    private boolean isPinned = false;
    
    @Builder.Default
    private boolean isArchived = false;
    
    @Builder.Default
    private boolean isDeleted = false;
}
