package com.delivery.foodDelivery.support.escalation.service;

import com.delivery.foodDelivery.support.conversation.model.CallSession;
import com.delivery.foodDelivery.support.conversation.model.SupportTicket;
import com.delivery.foodDelivery.repository.mongo.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallEscalationService {

    private final SupportTicketRepository ticketRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Escalates an ongoing voice call session to a human agent dashboard.
     * @param session Call session to escalate
     * @param reason Reason for escalation
     * @return SupportTicket reference ID
     */
    public String escalateCall(CallSession session, String reason) {
        String ticketId = "TKT-" + (100 + new Random().nextInt(900)) + (10 + new Random().nextInt(90));
        
        log.info("Escalating callSid: {} to human agent. Ticket: {}, Reason: {}", 
                session.getCallSid(), ticketId, reason);

        // Map Chat History from LLM roles [user, assistant] to frontend sender names [customer, agent]
        List<Map<String, String>> chatHistory = new ArrayList<>();
        if (session.getChatHistory() != null) {
            for (Map<String, String> msg : session.getChatHistory()) {
                String role = msg.get("role");
                String content = msg.get("content");
                
                Map<String, String> fMsg = new HashMap<>();
                if ("user".equalsIgnoreCase(role)) {
                    fMsg.put("sender", "customer");
                } else if ("assistant".equalsIgnoreCase(role)) {
                    fMsg.put("sender", "agent");
                } else {
                    fMsg.put("sender", "system");
                }
                fMsg.put("text", content);
                chatHistory.add(fMsg);
            }
        }

        // Add a system event to log the transfer
        Map<String, String> sysEvent = new HashMap<>();
        sysEvent.put("sender", "system");
        sysEvent.put("text", "Call escalated to support desk. Reason: " + reason);
        chatHistory.add(sysEvent);

        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .customerId(session.getUserId() != null ? String.valueOf(session.getUserId()) : "GUEST")
                .customerName(session.getUserName() != null ? session.getUserName() : "Guest Caller")
                .customerPhone(session.getFromPhone())
                .orderId(session.getActiveOrderId() != null ? String.valueOf(session.getActiveOrderId()) : "N/A")
                .issue(reason)
                .priority("HIGH")
                .status("ACTIVE")
                .chatHistory(chatHistory)
                .createdAt(LocalDateTime.now())
                .build();

        // 1. Persist to MongoDB
        ticketRepository.save(ticket);

        // 2. Format payload for WebSocket
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", ticket.getId());
        payload.put("customer", ticket.getCustomerName());
        payload.put("phone", ticket.getCustomerPhone());
        payload.put("issue", ticket.getIssue());
        payload.put("orderId", ticket.getOrderId());
        payload.put("priority", ticket.getPriority());
        payload.put("status", ticket.getStatus());
        payload.put("chat", chatHistory);

        // 3. Broadcast to /topic/admin/escalation
        try {
            messagingTemplate.convertAndSend("/topic/admin/escalation", payload);
            log.info("Successfully broadcasted escalation ticket {} to WebSocket /topic/admin/escalation", ticketId);
        } catch (Exception e) {
            log.error("Failed to broadcast escalation ticket over WebSocket: {}", e.getMessage());
        }

        return ticketId;
    }
}
