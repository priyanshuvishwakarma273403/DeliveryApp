package com.delivery.foodDelivery.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    private String id;
    
    private String invoiceNumber;
    
    private String orderId;
    
    private String customerId;
    
    private String restaurantId;
    
    private String type;                 // "CUSTOMER", "RESTAURANT", "REFUND", "SETTLEMENT"
    
    private Double totalAmount;
    
    private Double cgst;
    
    private Double sgst;
    
    private Double igst;
    
    private Double deliveryCharges;
    
    private Double platformFee;
    
    private Double discount;
    
    private Double finalPaidAmount;
    
    private List<InvoiceItem> items;
    
    private LocalDateTime timestamp;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItem {
        private String description;
        private int quantity;
        private Double unitPrice;
        private Double taxAmount;
        private Double totalAmount;
    }
}
