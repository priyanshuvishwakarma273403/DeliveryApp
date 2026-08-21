package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.EventEnvelope;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderStateManager {

    private final OrderRepository orderRepository;
    private final KafkaService kafkaService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        // CREATED transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.CREATED, Set.of(
                OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED
        ));
        // PAYMENT_PENDING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.PAYMENT_PENDING, Set.of(
                OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED
        ));
        // PAYMENT_CONFIRMED transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.PAYMENT_CONFIRMED, Set.of(
                OrderStatus.RESTAURANT_PENDING, OrderStatus.CANCELLED
        ));
        // RESTAURANT_PENDING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.RESTAURANT_PENDING, Set.of(
                OrderStatus.RESTAURANT_ACCEPTED, OrderStatus.REJECTED, OrderStatus.RESTAURANT_CANCELLED, OrderStatus.CANCELLED
        ));
        // RESTAURANT_ACCEPTED transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.RESTAURANT_ACCEPTED, Set.of(
                OrderStatus.KITCHEN_PREPARING, OrderStatus.CANCELLED
        ));
        // KITCHEN_PREPARING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.KITCHEN_PREPARING, Set.of(
                OrderStatus.FOOD_READY, OrderStatus.CANCELLED
        ));
        // FOOD_READY transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.FOOD_READY, Set.of(
                OrderStatus.RIDER_ASSIGNMENT_PENDING, OrderStatus.CANCELLED
        ));
        // RIDER_ASSIGNMENT_PENDING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.RIDER_ASSIGNMENT_PENDING, Set.of(
                OrderStatus.RIDER_ASSIGNED, OrderStatus.CANCELLED
        ));
        // RIDER_ASSIGNED transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.RIDER_ASSIGNED, Set.of(
                OrderStatus.RIDER_ARRIVING, OrderStatus.RIDER_CANCELLED, OrderStatus.CANCELLED
        ));
        // RIDER_ARRIVING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.RIDER_ARRIVING, Set.of(
                OrderStatus.PICKED_UP, OrderStatus.RIDER_CANCELLED, OrderStatus.CANCELLED
        ));
        // PICKED_UP transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.PICKED_UP, Set.of(
                OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERY_FAILED
        ));
        // OUT_FOR_DELIVERY transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.OUT_FOR_DELIVERY, Set.of(
                OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED
        ));
        // RIDER_CANCELLED transitions -> goes back to RIDER_ASSIGNMENT_PENDING
        ALLOWED_TRANSITIONS.put(OrderStatus.RIDER_CANCELLED, Set.of(
                OrderStatus.RIDER_ASSIGNMENT_PENDING
        ));
        // DELIVERY_FAILED transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.DELIVERY_FAILED, Set.of(
                OrderStatus.REFUND_PENDING
        ));
        // REFUND_PENDING transitions
        ALLOWED_TRANSITIONS.put(OrderStatus.REFUND_PENDING, Set.of(
                OrderStatus.REFUNDED
        ));

        // Legacy states support
        ALLOWED_TRANSITIONS.put(OrderStatus.PLACED, Set.of(
                OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.RESTAURANT_PENDING
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.CONFIRMED, Set.of(
                OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.KITCHEN_PREPARING
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.PREPARING, Set.of(
                OrderStatus.PACKED, OrderStatus.CANCELLED, OrderStatus.FOOD_READY
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.PACKED, Set.of(
                OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED, OrderStatus.RIDER_ASSIGNMENT_PENDING
        ));
        ALLOWED_TRANSITIONS.put(OrderStatus.READY_FOR_PICKUP, Set.of(
                OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED
        ));
    }

    public boolean isTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return true;
        }
        if (current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED || current == OrderStatus.REJECTED 
                || current == OrderStatus.PAYMENT_FAILED || current == OrderStatus.RESTAURANT_CANCELLED || current == OrderStatus.REFUNDED) {
            return false;
        }
        if (next == OrderStatus.CANCELLED) {
            return true;
        }
        Set<OrderStatus> allowed = ALLOWED_TRANSITIONS.get(current);
        return allowed != null && allowed.contains(next);
    }

    @Transactional
    public Order transitionTo(Long orderId, OrderStatus nextStatus, String correlationId, String source) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));
        
        OrderStatus current = order.getStatus();
        if (!isTransitionAllowed(current, nextStatus)) {
            throw new BusinessException("Invalid order state transition: " + current + " -> " + nextStatus);
        }

        order.setStatus(nextStatus);
        Order saved = orderRepository.save(order);
        log.info("Order {} transitioned from {} to {} (correlationId={})", orderId, current, nextStatus, correlationId);

        // Publish event to Kafka
        publishStatusEvent(saved, current, nextStatus, correlationId, source);

        // Broadcast to WebSocket clients
        broadcastWebSocket(saved);

        return saved;
    }

    private void publishStatusEvent(Order order, OrderStatus fromStatus, OrderStatus toStatus, String correlationId, String source) {
        try {
            String topic = getTopicForStatus(toStatus);
            String eventType = "ORDER_" + toStatus.name();
            
            EventEnvelope envelope = EventEnvelope.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType(eventType)
                    .schemaVersion(1)
                    .orderId(order.getId())
                    .restaurantId(order.getRestaurantId())
                    .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                    .correlationId(correlationId != null ? correlationId : UUID.randomUUID().toString())
                    .timestamp(System.currentTimeMillis())
                    .source(source != null ? source : "ORDER_STATE_MANAGER")
                    .payload(Map.of(
                            "fromStatus", fromStatus.name(),
                            "toStatus", toStatus.name(),
                            "amount", order.getTotalAmount()
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(envelope);
            kafkaService.sendMessage(topic, json);
        } catch (Exception e) {
            log.error("Failed to publish status transition event for order {}", order.getId(), e);
        }
    }

    private void broadcastWebSocket(Order order) {
        try {
            // Broadcast to customer
            String customerDest = "/topic/order/" + order.getCustomer().getId();
            messagingTemplate.convertAndSend(customerDest, order.getStatus().name());

            // Broadcast to admin dashboard
            String adminDest = "/topic/admin/orders";
            messagingTemplate.convertAndSend(adminDest, Map.of(
                    "orderId", order.getId(),
                    "status", order.getStatus().name(),
                    "restaurantId", order.getRestaurantId(),
                    "updatedAt", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Failed to broadcast websocket notification for order {}", order.getId(), e);
        }
    }

    private String getTopicForStatus(OrderStatus status) {
        return switch (status) {
            case CREATED -> "foodiq.order.created";
            case PAYMENT_CONFIRMED -> "foodiq.order.payment.confirmed";
            case RESTAURANT_ACCEPTED -> "foodiq.order.accepted";
            case KITCHEN_PREPARING -> "foodiq.kitchen.started";
            case FOOD_READY -> "foodiq.kitchen.ready";
            case RIDER_ASSIGNED -> "foodiq.rider.assigned";
            case PICKED_UP -> "foodiq.order.picked-up";
            case DELIVERED -> "foodiq.order.delivered";
            case CANCELLED -> "foodiq.order.cancelled";
            default -> "foodiq.order.updates";
        };
    }
}
