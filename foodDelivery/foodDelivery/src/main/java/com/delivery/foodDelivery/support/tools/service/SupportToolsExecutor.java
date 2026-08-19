package com.delivery.foodDelivery.support.tools.service;

import com.delivery.foodDelivery.dto.response.OrderResponse;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.Refund;
import com.delivery.foodDelivery.entity.Transaction;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.enums.PaymentStatus;
import com.delivery.foodDelivery.repository.mongo.TransactionRepository;
import com.delivery.foodDelivery.service.OrderService;
import com.delivery.foodDelivery.service.FinancialService;
import com.delivery.foodDelivery.support.config.VoiceSupportConfig;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import com.delivery.foodDelivery.support.conversation.model.SupportTicket;
import com.delivery.foodDelivery.repository.mongo.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportToolsExecutor {

    private final OrderService orderService;
    private final FinancialService financialService;
    private final SupportTicketRepository ticketRepository;
    private final TransactionRepository transactionRepository;
    private final VoiceSupportConfig config;

    /**
     * Retrieves the status of a specific order.
     */
    public String checkOrderStatus(CallSession session, Long orderId) {
        if (!session.isAuthenticated() || session.getUserId() == null) {
            return "Error: Caller is not authenticated. Please authenticate first.";
        }

        try {
            OrderResponse order = orderService.getOrderById(orderId, session.getUserId());
            session.setActiveOrderId(orderId);
            return String.format("Order #%d details:\nStatus: %s\nTotal: ₹%.2f\nItems: %d\nPayment Status: %s\nPayment Method: %s",
                    order.getId(),
                    order.getStatus(),
                    order.getFinalAmount(),
                    order.getOrderItems().size(),
                    order.getPaymentStatus(),
                    order.getPaymentMethod());
        } catch (Exception e) {
            log.error("Error retrieving order status: {}", e.getMessage());
            return "Order not found or access denied for ID: " + orderId;
        }
    }

    /**
     * Tracks the delivery partner details and coordinates.
     */
    public String trackDeliveryPartner(CallSession session, Long orderId) {
        if (!session.isAuthenticated() || session.getUserId() == null) {
            return "Error: Caller is not authenticated.";
        }

        try {
            OrderResponse order = orderService.getOrderById(orderId, session.getUserId());
            if (order.getDelivery() == null) {
                return "Delivery partner not assigned to this order yet.";
            }

            return String.format("Delivery Tracking for Order #%d:\nStatus: %s\nPartner Name: %s\nPartner Phone: %s\nEstimated coordinates: Lat %s, Lng %s",
                    orderId,
                    order.getDelivery().getStatus(),
                    order.getDelivery().getDeliveryPartnerName() != null ? order.getDelivery().getDeliveryPartnerName() : "Assigning...",
                    order.getDelivery().getDeliveryPartnerPhone() != null ? order.getDelivery().getDeliveryPartnerPhone() : "N/A",
                    order.getDelivery().getCurrentLatitude() != null ? order.getDelivery().getCurrentLatitude() : "N/A",
                    order.getDelivery().getCurrentLongitude() != null ? order.getDelivery().getCurrentLongitude() : "N/A");
        } catch (Exception e) {
            return "Order or delivery details not found for ID: " + orderId;
        }
    }

    /**
     * Cancels an active order if within the cancellation window (e.g. 5 minutes).
     */
    public String cancelActiveOrder(CallSession session, Long orderId) {
        if (!session.isAuthenticated() || session.getUserId() == null) {
            return "Error: Authentication required to cancel order.";
        }

        try {
            Order order = orderService.findById(orderId);
            if (!order.getCustomer().getId().equals(session.getUserId())) {
                return "Error: Unauthorized. You cannot cancel this order.";
            }

            // Check 5-minute cancellation window logic
            LocalDateTime created = order.getCreatedDate();
            if (created != null) {
                long minutesPassed = Duration.between(created, LocalDateTime.now()).toMinutes();
                if (minutesPassed > config.getOrderCancelWindowMinutes()) {
                    return String.format("Cancellation rejected: Order was placed %d minutes ago. Cancellations are only permitted within %d minutes of placement.",
                            minutesPassed, config.getOrderCancelWindowMinutes());
                }
            }

            if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == OrderStatus.DELIVERED) {
                return "Cancellation rejected: Order is already out for delivery or delivered.";
            }

            orderService.cancelOrder(orderId, session.getUserId());
            return "Success: Order #" + orderId + " has been cancelled. Refund initiated to source.";
        } catch (Exception e) {
            log.error("Failed to cancel order: {}", e.getMessage());
            return "Cancellation failed: " + e.getMessage();
        }
    }

    /**
     * Initiates a refund for an order under safe conditions.
     */
    public String initiatePaymentRefund(CallSession session, Long orderId) {
        if (!session.isAuthenticated() || session.getUserId() == null) {
            return "Error: Caller not authenticated.";
        }

        try {
            Order order = orderService.findById(orderId);
            if (!order.getCustomer().getId().equals(session.getUserId())) {
                return "Error: Unauthorized.";
            }

            // Check financial safety cap
            if (order.getFinalAmount() > config.getMaxAutoRefundLimit()) {
                return String.format("Refund rejected: Order total (₹%.2f) exceeds automated refund threshold (₹%.2f). Escalating to a human support agent.",
                        order.getFinalAmount(), config.getMaxAutoRefundLimit());
            }

            // Find completed transaction
            List<Transaction> txns = transactionRepository.findByCustomerId(String.valueOf(session.getUserId()));
            Optional<Transaction> txnOpt = txns.stream()
                    .filter(t -> String.valueOf(orderId).equals(t.getOrderId()) && "COMPLETED".equalsIgnoreCase(t.getStatus()))
                    .findFirst();

            if (!txnOpt.isPresent()) {
                return "Error: No completed transactions found for Order #" + orderId;
            }

            Transaction transaction = txnOpt.get();
            // Call FinancialService to process refund
            Refund refund = financialService.initiateRefund(
                    transaction.getId(), 
                    order.getFinalAmount(), 
                    "WALLET", 
                    "AI SUPPORT REFUND REQUEST"
            );

            if ("SUCCESS".equalsIgnoreCase(refund.getStatus())) {
                return String.format("Success: Refund of ₹%.2f initiated to wallet. Reference ID: %s",
                        refund.getAmount(), refund.getGatewayRefundId() != null ? refund.getGatewayRefundId() : "RFD_" + refund.getId());
            } else {
                return "Refund failed: Gateway returned failure status: " + refund.getFailureReason();
            }
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            return "Refund failed: " + e.getMessage();
        }
    }

    /**
     * Creates a support ticket in MongoDB.
     */
    public String createSupportTicket(CallSession session, String issueDescription) {
        String ticketId = "TKT-" + (100 + new Random().nextInt(900)) + (10 + new Random().nextInt(90));
        
        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .customerId(session.getUserId() != null ? String.valueOf(session.getUserId()) : "GUEST")
                .customerName(session.getUserName() != null ? session.getUserName() : "Guest Caller")
                .customerPhone(session.getFromPhone())
                .orderId(session.getActiveOrderId() != null ? String.valueOf(session.getActiveOrderId()) : "N/A")
                .issue(issueDescription)
                .priority("HIGH")
                .status("ACTIVE")
                .chatHistory(session.getChatHistory())
                .createdAt(LocalDateTime.now())
                .build();

        ticketRepository.save(ticket);
        log.info("Saved support ticket: {} in MongoDB", ticketId);
        return ticketId;
    }
}
