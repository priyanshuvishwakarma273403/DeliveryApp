package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document(collection = "notification_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplate {

    @Id
    private String id;

    private String event;       // e.g. "ORDER_PLACED", "OTP_RECEIVED", "INVENTORY_LOW"
    private String titleTemplate; // Default title template, e.g. "Order #{{orderId}} Status Update"
    private String bodyTemplate;  // Default body template, e.g. "Dear {{customerName}}, your order is now {{status}}."
    
    // Custom channel overrides (e.g. key="SMS" -> "{{otp}} is your FoodIQ verification code.", key="EMAIL_SUBJECT" -> "...")
    private Map<String, String> channelTemplates;

    private String language;    // e.g. "en", "es", "hi"

    @Builder.Default
    private boolean active = true;
}
