package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    private String id;
    
    private String userId;
    
    private String planType;          // "GOLD", "PREMIUM", "RESTAURANT_VIP"
    
    private String billingCycle;      // "MONTHLY", "YEARLY"
    
    private Double price;
    
    private String status;            // "ACTIVE", "GRACE_PERIOD", "CANCELLED", "EXPIRED"
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
    
    private boolean autoRenew;
    
    private LocalDateTime lastPaymentDate;
}
