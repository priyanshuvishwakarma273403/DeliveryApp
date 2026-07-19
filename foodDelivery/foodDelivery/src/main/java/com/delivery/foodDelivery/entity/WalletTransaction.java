package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    private String id;
    
    private String userId;        // References customer user_id, restaurantId, or driverId
    
    private String userRole;      // "CUSTOMER", "RESTAURANT", "DRIVER", "ADMIN"
    
    private Double amount;
    
    private String type;          // "CREDIT", "DEBIT"
    
    private String source;        // "CASHBACK", "ORDER_PAYMENT", "REFUND", "ADJUSTMENT", "PROMO", "GIFT_CARD", "REFERRAL", "PLATFORM_PAYOUT"
    
    private String description;
    
    private LocalDateTime timestamp;
    
    private LocalDateTime expiryDate; // Promo credits can expire
}
