package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "cashback_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashbackCampaign {

    @Id
    private String id;
    
    private String name;
    
    private String type;             // "INSTANT", "SCHEDULED", "FESTIVAL", "REFERRAL", "RESTAURANT"
    
    private Double minOrderAmount;
    
    private Double cashbackPercentage;
    
    private Double maxCashbackAmount;
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
    
    private boolean active;
}
