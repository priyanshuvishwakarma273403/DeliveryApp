package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "blacklist_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlacklistItem {

    @Id
    private String id;

    private String type; // e.g. "IP", "DEVICE", "EMAIL", "PHONE", "USER_ID", "RESTAURANT_ID", "DRIVER_ID"

    @Indexed
    private String value; // The actual blocked IP, phone, device ID, etc.

    private String reason;

    private LocalDateTime createdAt;

    private String addedBy;
}
