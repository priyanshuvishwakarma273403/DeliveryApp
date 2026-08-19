package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.mongo.SupportTicketRepository;
import com.delivery.foodDelivery.support.conversation.model.SupportTicket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
@Slf4j
public class SupportTicketController {

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getTickets(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SupportTicket> tickets;
        if ("ADMIN".equalsIgnoreCase(user.getRole().name()) || 
            "SUPER_ADMIN".equalsIgnoreCase(user.getRole().name()) || 
            "SUPPORT_EXECUTIVE".equalsIgnoreCase(user.getRole().name())) {
            tickets = ticketRepository.findAll();
        } else {
            tickets = ticketRepository.findByCustomerId(String.valueOf(user.getId()));
        }

        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<SupportTicket>> createTicket(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String orderId = request.getOrDefault("orderId", "N/A");
        String complaintType = request.getOrDefault("type", "General Enquiry");
        String description = request.getOrDefault("description", "");

        String ticketId = "TKT-" + (100 + new Random().nextInt(900)) + (10 + new Random().nextInt(90));

        List<Map<String, String>> chatHistory = new ArrayList<>();
        Map<String, String> initialMessage = new HashMap<>();
        initialMessage.put("sender", "customer");
        initialMessage.put("text", "Category: " + complaintType + ". Issue description: " + description);
        chatHistory.add(initialMessage);

        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("sender", "system");
        systemMessage.put("text", "Dispute raised. Verification in progress.");
        chatHistory.add(systemMessage);

        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .customerId(String.valueOf(user.getId()))
                .customerName(user.getName())
                .customerPhone(user.getPhone() != null ? user.getPhone() : "+91 9999999999")
                .orderId(orderId)
                .issue(complaintType + ": " + description)
                .priority("HIGH")
                .status("ACTIVE")
                .chatHistory(chatHistory)
                .createdAt(LocalDateTime.now())
                .build();

        ticketRepository.save(ticket);
        log.info("Successfully saved user support ticket {} to MongoDB", ticketId);

        // Broadcast ticket details to the Support Executive Dashboard over WebSockets
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", ticket.getId());
            payload.put("customer", ticket.getCustomerName());
            payload.put("phone", ticket.getCustomerPhone());
            payload.put("issue", ticket.getIssue());
            payload.put("orderId", ticket.getOrderId());
            payload.put("priority", ticket.getPriority());
            payload.put("status", ticket.getStatus());
            payload.put("chat", chatHistory);

            messagingTemplate.convertAndSend("/topic/admin/escalation", payload);
            log.info("Successfully broadcasted customer support ticket {} via WebSocket", ticketId);
        } catch (Exception e) {
            log.error("Failed to broadcast customer support ticket via WebSocket", e);
        }

        return ResponseEntity.ok(ApiResponse.success("Dispute ticket raised successfully!", ticket));
    }
}
