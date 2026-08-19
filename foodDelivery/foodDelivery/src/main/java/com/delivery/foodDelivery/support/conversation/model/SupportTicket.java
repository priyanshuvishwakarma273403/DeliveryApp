package com.delivery.foodDelivery.support.conversation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "support_tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicket {

    @Id
    private String id;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String orderId;
    private String issue;
    private String priority;
    private String status; // "ACTIVE", "RESOLVED", "CLOSED"
    private List<Map<String, String>> chatHistory;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
