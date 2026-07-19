package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "driver_payouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    @Id
    private String id;
    
    private String driverId;
    
    private LocalDateTime periodStart;
    
    private LocalDateTime periodEnd;
    
    private Double baseDeliveryFee;
    
    private Double customerTips;
    
    private Double rainIncentive;
    
    private Double nightIncentive;
    
    private Double bonusAmount;
    
    private Double totalPayoutAmount;
    
    private String status;           // "PENDING", "COMPLETED", "FAILED"
    
    private String transactionId;    // Reference to payment transaction
    
    private LocalDateTime timestamp;
}
