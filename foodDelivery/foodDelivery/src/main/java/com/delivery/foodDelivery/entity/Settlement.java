package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settlement {

    @Id
    private String id;
    
    private String restaurantId;
    
    private LocalDateTime periodStart;
    
    private LocalDateTime periodEnd;
    
    private Double totalOrdersAmount;
    
    private Double platformCommission;
    
    private Double taxesWithheld;
    
    private Double deliveryChargesWithheld;
    
    private Double penalties;
    
    private Double refundDeductions;
    
    private Double finalSettlementAmount;
    
    private String status;               // "PENDING", "COMPLETED", "FAILED"
    
    private String transactionId;        // Reference to bank transfer transaction ID
    
    private LocalDateTime timestamp;
    
    private String invoiceNumber;
}
