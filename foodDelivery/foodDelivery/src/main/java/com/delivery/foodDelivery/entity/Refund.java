package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    private String id;
    
    private String transactionId;
    
    private String orderId;
    
    private String gatewayRefundId;
    
    private Double amount;
    
    private String type;             // "FULL", "PARTIAL"
    
    private String status;           // "PENDING", "SUCCESS", "FAILED"
    
    private String channel;          // "WALLET", "ORIGINAL_SOURCE"
    
    private String refundReason;
    
    private String processedBy;      // "AUTO", "MANUAL"
    
    private int retryCount;
    
    private String failureReason;
    
    @Builder.Default
    private List<String> timeline = new ArrayList<>();
    
    private LocalDateTime createdAt;
    
    private LocalDateTime resolvedAt;
}
