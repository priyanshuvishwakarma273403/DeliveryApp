package com.delivery.foodDelivery.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "search_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryItem {
    @Id
    private String id;
    
    private String userId; // Store as string to handle anonymous (IP/Session) or user IDs
    private String query;
    private LocalDateTime timestamp;
    
    @Builder.Default
    private int count = 1;
    
    @Builder.Default
    private boolean favorite = false;
}
