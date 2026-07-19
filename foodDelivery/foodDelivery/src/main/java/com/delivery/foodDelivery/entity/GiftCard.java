package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "gift_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiftCard {

    @Id
    private String id;
    
    @Indexed(unique = true)
    private String code;
    
    private String purchaserId;
    
    private String receiverId;
    
    private Double initialAmount;
    
    private Double balance;
    
    private String status;           // "ACTIVE", "REDEEMED", "EXPIRED"
    
    private LocalDateTime createdAt;
    
    private LocalDateTime expiryAt;
    
    private LocalDateTime redeemedAt;
}
