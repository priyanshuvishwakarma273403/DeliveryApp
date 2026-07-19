package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notification_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationCampaign {

    @Id
    private String id;
    
    private String name;
    private String type;            // e.g. "COUPON", "FESTIVAL", "WEEKEND", "FLASH_SALE"
    private String title;
    private String body;
    private String targetSegment;   // e.g. "ALL", "CUSTOMERS", "RESTAURANTS", "DRIVERS"
    private String city;            // Specific city filter
    private String status;          // e.g. "DRAFT", "SCHEDULED", "RUNNING", "COMPLETED", "CANCELLED"
    private String channel;         // e.g. "EMAIL", "SMS", "PUSH", "WHATSAPP"
    
    private int sentCount;
    private int readCount;
    private int clickCount;
    
    private LocalDateTime scheduledTime;
    private LocalDateTime createdTime;
}
