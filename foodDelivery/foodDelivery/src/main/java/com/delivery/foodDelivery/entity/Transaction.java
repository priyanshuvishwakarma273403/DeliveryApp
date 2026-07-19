package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "financial_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;

    private String gatewayTransactionId;
    
    private String orderId;
    
    private String customerId;
    
    private String restaurantId;
    
    private String branchId;
    
    private String paymentMethod; // e.g. "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET", "COD", "MIXED"
    
    private String gatewayName;    // e.g. "RAZORPAY", "STRIPE", "PAYU", "INTERNAL_WALLET"
    
    private String status;         // "CREATED", "PENDING", "AUTHORIZED", "CAPTURED", "COMPLETED", "FAILED", "CANCELLED", "REFUND_INITIATED", "REFUND_COMPLETED", "EXPIRED"

    private Double amount;
    
    private Double walletDeductionAmount;
    
    private Double gatewayAmount;
    
    private String currency;       // e.g. "INR", "USD"
    
    private LocalDateTime timestamp;
    
    private String failureReason;
    
    private Map<String, Object> gatewayResponse;
}
