package com.delivery.foodDelivery.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "search_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchAuditLog {
    @Id
    private String id;
    
    private String userId;
    private String userRole;
    private String query;
    private LocalDateTime timestamp;
    private long executionTimeMs;
    private int resultCount;
    private String ipAddress;
    private String clientType;
}
