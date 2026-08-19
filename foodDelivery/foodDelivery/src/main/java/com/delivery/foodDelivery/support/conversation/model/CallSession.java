package com.delivery.foodDelivery.support.conversation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSession implements Serializable {
    
    private static final long serialVersionUID = 1L;

    private String callSid;
    private String fromPhone;
    private Long userId;
    private String userName;
    private Long activeOrderId;
    
    @Builder.Default
    private List<Map<String, String>> chatHistory = new ArrayList<>();
    
    private boolean authenticated;
    private String authOtpCode;
    
    @Builder.Default
    private int authAttempts = 0;
    
    private String lastIntent;
    
    @Builder.Default
    private int errorCount = 0;

    public void addMessage(String role, String text) {
        if (this.chatHistory == null) {
            this.chatHistory = new ArrayList<>();
        }
        Map<String, String> msg = new HashMap<>();
        msg.put("role", role);
        msg.put("content", text);
        this.chatHistory.add(msg);
    }
}
