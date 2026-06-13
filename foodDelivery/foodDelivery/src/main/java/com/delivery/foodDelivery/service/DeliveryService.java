package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.request.DeliveryActionRequest;
import com.delivery.foodDelivery.dto.request.LocationUpdateRequest;
import com.delivery.foodDelivery.dto.response.DeliveryResponse;
import com.delivery.foodDelivery.dto.response.LocationMessage;
import com.delivery.foodDelivery.dto.response.OrderResponse;
import com.delivery.foodDelivery.entity.Delivery;
import com.delivery.foodDelivery.entity.DeliveryPartner;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.Restaurant;
import com.delivery.foodDelivery.enums.DeliveryStatus;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.exception.ResourceNotFoundException;
import com.delivery.foodDelivery.exception.UnauthorizedException;
import com.delivery.foodDelivery.repository.jpa.DeliveryPartnerRepository;
import com.delivery.foodDelivery.repository.jpa.DeliveryRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Manages delivery partner assignment and real-time order tracking.
 * Broadcasts location updates via STOMP WebSocket.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final OrderRepository           orderRepository;
    private final OrderService               orderService;
    private final RestaurantService          restaurantService;
    private final SimpMessagingTemplate messagingTemplate;
    private final KafkaService        kafkaService;

    // ──────────────────────────────────────────────
    // Admin: Assign a delivery partner to an order
    // ──────────────────────────────────────────────

    @Transactional
    public DeliveryResponse assignDeliveryPartner(Long orderId, Long partnerId) {
        Order order = orderService.findById(orderId);

        if (order.getStatus() != OrderStatus.READY_FOR_PICKUP &&
                order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException(
                    "Cannot assign delivery partner to order in status: " + order.getStatus());
        }
        if (deliveryRepository.findByOrderId(orderId).isPresent()) {
            throw new BusinessException("Delivery partner already assigned to order: " + orderId);
        }

        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryPartner", partnerId));

        if (!partner.isAvailable()) {
            throw new BusinessException("Delivery partner is not available: " + partnerId);
        }

        Delivery delivery = Delivery.builder()
                .order(order)
                .deliveryPartner(partner)
                .status(DeliveryStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now())
                .build();

        partner.setAvailable(false);
        partnerRepository.save(partner);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery assigned: orderId={} partnerId={}", orderId, partnerId);
        return toResponse(saved);
    }

    // ──────────────────────────────────────────────
    // Delivery Partner: Accept or Reject assignment
    // ──────────────────────────────────────────────

    @Transactional
    public DeliveryResponse handleDeliveryAction(Long orderId, Long partnerId,
                                                 DeliveryActionRequest request) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Delivery not found for order: " + orderId));

        if (!delivery.getDeliveryPartner().getId().equals(partnerId)) {
            throw new UnauthorizedException("This delivery is not assigned to you.");
        }

        String action = request.getAction().toUpperCase();

        switch (action) {
            case "ACCEPT" -> {
                delivery.setStatus(DeliveryStatus.ACCEPTED);
                delivery.setAcceptedAt(LocalDateTime.now());
                // Do not update order status here; update on pickup!
                log.info("Delivery ACCEPTED: orderId={} partnerId={}", orderId, partnerId);

                // Notify user via WebSocket about the accepted delivery
                try {
                    Restaurant restaurant = restaurantService.findById(delivery.getOrder().getRestaurantId());
                    OrderResponse response = orderService.toResponse(delivery.getOrder(), restaurant.getName());
                    messagingTemplate.convertAndSend("/topic/order/" + delivery.getOrder().getCustomer().getId(), response);
                } catch (Exception e) {
                    log.error("Failed to notify user about accepted delivery", e);
                }
            }
            case "REJECT" -> {
                delivery.setStatus(DeliveryStatus.REJECTED);
                delivery.setRejectionReason(request.getRejectionReason());
                // Free the partner for re-assignment
                delivery.getDeliveryPartner().setAvailable(true);
                partnerRepository.save(delivery.getDeliveryPartner());
                log.info("Delivery REJECTED: orderId={} reason={}", orderId,
                        request.getRejectionReason());
            }
            default -> throw new BusinessException("Invalid action: " + action +
                    ". Must be ACCEPT or REJECT.");
        }

        return toResponse(deliveryRepository.save(delivery));
    }

    // ──────────────────────────────────────────────
    // Delivery Partner: Mark as Picked Up / Delivered
    // ──────────────────────────────────────────────

    @Transactional
    public DeliveryResponse markPickedUp(Long orderId, Long partnerId) {
        Delivery delivery = getValidatedDelivery(orderId, partnerId);
        if (delivery.getStatus() != DeliveryStatus.ACCEPTED) {
            throw new BusinessException("Order must be ACCEPTED before marking picked up.");
        }
        delivery.setStatus(DeliveryStatus.PICKED_UP);
        delivery.setPickedUpAt(LocalDateTime.now());

        // Update corresponding order status to OUT_FOR_DELIVERY (notifies customer)
        orderService.updateOrderStatus(orderId, OrderStatus.OUT_FOR_DELIVERY.name());

        log.info("Order {} picked up by partner {}", orderId, partnerId);
        return toResponse(deliveryRepository.save(delivery));
    }

    @Transactional
    public DeliveryResponse markDelivered(Long orderId, Long partnerId) {
        Delivery delivery = getValidatedDelivery(orderId, partnerId);
        if (delivery.getStatus() != DeliveryStatus.PICKED_UP) {
            throw new BusinessException("Order must be PICKED_UP before marking delivered.");
        }
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());

        // Free partner for next order
        delivery.getDeliveryPartner().setAvailable(true);
        DeliveryPartner partner = delivery.getDeliveryPartner();
        partner.setTotalDeliveries(
                partner.getTotalDeliveries() == null ? 1 : partner.getTotalDeliveries() + 1);
        partnerRepository.save(partner);

        // Mark order delivered
        orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED.name());
        log.info("Order {} delivered by partner {}", orderId, partnerId);
        return toResponse(deliveryRepository.save(delivery));
    }

    // ──────────────────────────────────────────────
    // Real-time Location Update (WebSocket broadcast)
    // ──────────────────────────────────────────────

    @Transactional
    public void updateLocation(Long orderId, Long partnerId, LocationUpdateRequest request) {
        Delivery delivery = getValidatedDelivery(orderId, partnerId);

        // Persist latest coordinates
        delivery.setCurrentLatitude(request.getLatitude());
        delivery.setCurrentLongitude(request.getLongitude());
        deliveryRepository.save(delivery);

        // Also update partner's live coordinates
        delivery.getDeliveryPartner().setCurrentLatitude(request.getLatitude());
        delivery.getDeliveryPartner().setCurrentLongitude(request.getLongitude());
        partnerRepository.save(delivery.getDeliveryPartner());

        // Broadcast over WebSocket: /topic/location/{orderId}
        LocationMessage message = LocationMessage.builder()
                .orderId(orderId)
                .deliveryPartnerId(partnerId)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(delivery.getStatus().name())
                .build();

        messagingTemplate.convertAndSend("/topic/location/" + orderId, message);

        // Kafka: Stream location update for real-time analytics and tracking history
        kafkaService.sendLocationUpdate(delivery.getId(), request.getLatitude(), request.getLongitude());

        log.debug("Location broadcast: orderId={} [{}, {}]", orderId,
                request.getLatitude(), request.getLongitude());
    }

    // ──────────────────────────────────────────────
    // Queries
    // ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryByOrder(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Delivery not found for order: " + orderId));
        return toResponse(delivery);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAvailableOrdersForPickup() {
        List<OrderResponse> available = new java.util.ArrayList<>();
        for (OrderStatus status : List.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.PACKED, OrderStatus.READY_FOR_PICKUP)) {
            List<Order> orders = orderRepository.findByStatus(status);
            for (Order order : orders) {
                if (deliveryRepository.findByOrderId(order.getId()).isEmpty()) {
                    Restaurant restaurant = restaurantService.findById(order.getRestaurantId());
                    String restaurantName = restaurant != null ? restaurant.getName() : "Unknown Restaurant";
                    available.add(orderService.toResponse(order, restaurantName));
                }
            }
        }
        return available;
    }

    @Transactional
    public DeliveryResponse acceptAvailableOrder(Long orderId, Long partnerId) {
        Order order = orderService.findById(orderId);

        if (order.getStatus() == OrderStatus.DELIVERED ||
                order.getStatus() == OrderStatus.CANCELLED ||
                order.getStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            throw new BusinessException("Order cannot be accepted in status: " + order.getStatus());
        }

        if (deliveryRepository.findByOrderId(orderId).isPresent()) {
            throw new BusinessException("Order is already accepted by another rider.");
        }

        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryPartner", partnerId));

        if (!partner.isAvailable()) {
            throw new BusinessException("You are already on another delivery.");
        }

        Delivery delivery = Delivery.builder()
                .order(order)
                .deliveryPartner(partner)
                .status(DeliveryStatus.ACCEPTED)
                .assignedAt(LocalDateTime.now())
                .acceptedAt(LocalDateTime.now())
                .build();

        partner.setAvailable(false);
        partnerRepository.save(partner);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Rider {} accepted available order {}", partnerId, orderId);

        // Notify user via WebSocket that rider has accepted (sends updated OrderResponse)
        try {
            Restaurant restaurant = restaurantService.findById(order.getRestaurantId());
            OrderResponse response = orderService.toResponse(order, restaurant.getName());
            messagingTemplate.convertAndSend("/topic/order/" + order.getCustomer().getId(), response);
        } catch (Exception e) {
            log.error("Failed to notify user about accepted order", e);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getDeliveriesByPartner(Long partnerId) {
        return deliveryRepository.findByDeliveryPartnerId(partnerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getActiveDeliveriesByPartner(Long partnerId) {
        return deliveryRepository
                .findByDeliveryPartnerIdAndStatus(partnerId, DeliveryStatus.ACCEPTED)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────

    private Delivery getValidatedDelivery(Long orderId, Long partnerId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Delivery not found for order: " + orderId));
        if (!delivery.getDeliveryPartner().getId().equals(partnerId)) {
            throw new UnauthorizedException("This delivery is not assigned to you.");
        }
        return delivery;
    }

    private DeliveryResponse toResponse(Delivery d) {
        DeliveryPartner partner = d.getDeliveryPartner();
        return DeliveryResponse.builder()
                .id(d.getId())
                .orderId(d.getOrder().getId())
                .deliveryPartnerId(partner != null ? partner.getId() : null)
                .deliveryPartnerName(partner != null ? partner.getUser().getName() : null)
                .deliveryPartnerPhone(partner != null ? partner.getUser().getPhone() : null)
                .status(d.getStatus().name())
                .currentLatitude(d.getCurrentLatitude())
                .currentLongitude(d.getCurrentLongitude())
                .assignedAt(d.getAssignedAt())
                .acceptedAt(d.getAcceptedAt())
                .pickedUpAt(d.getPickedUpAt())
                .deliveredAt(d.getDeliveredAt())
                .build();
    }
}
