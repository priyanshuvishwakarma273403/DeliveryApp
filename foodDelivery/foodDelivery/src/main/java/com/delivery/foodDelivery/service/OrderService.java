package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.request.OrderRequest;
import com.delivery.foodDelivery.dto.response.DeliveryResponse;
import com.delivery.foodDelivery.dto.response.OrderItemResponse;
import com.delivery.foodDelivery.dto.response.OrderResponse;
import com.delivery.foodDelivery.dto.response.PaymentResponse;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.OrderStatus;
import com.delivery.foodDelivery.enums.PaymentStatus;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.exception.ResourceNotFoundException;
import com.delivery.foodDelivery.exception.UnauthorizedException;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.observability.metrics.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService         cartService;
    private final PaymentService      paymentService;
    private final KafkaService        kafkaService;
    private final WalletService       walletService;
    private final RestaurantService   restaurantService;
    private final MenuItemService     menuItemService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final EmailService        emailService;

    private final OrderMetrics        orderMetrics;
    private final PaymentMetrics      paymentMetrics;
    private final InventoryMetrics    inventoryMetrics;
    private final CartMetrics         cartMetrics;

    @Transactional
    public OrderResponse placeOrder(Long customerId, OrderRequest request) {
        cartMetrics.incrementCheckoutStarted();
        try {
            // 1. Load and validate cart
            Cart cart = cartService.getOrCreateCart(customerId);
            if (cart.getItems().isEmpty()) {
                throw new BusinessException("Cannot place order: cart is empty.");
            }

            // Assuming all items are from the same restaurant. 
            // We get the restaurant ID from the first item.
            String firstMenuItemId = cart.getItems().get(0).getMenuItemId();
            MenuItem firstMenuItem = menuItemService.findById(firstMenuItemId);
            String restaurantId = firstMenuItem.getRestaurantId();
            
            Restaurant restaurant = restaurantService.findById(restaurantId);
            if (!restaurant.isOpen()) {
                throw new BusinessException("Restaurant is currently closed.");
            }

            // Simulated Inventory/Stock Reservation check
            for (CartItem ci : cart.getItems()) {
                MenuItem mi = menuItemService.findById(ci.getMenuItemId());
                if (!mi.isAvailable()) {
                    inventoryMetrics.incrementOutOfStock();
                    inventoryMetrics.incrementReservationFailed();
                    throw new BusinessException("Menu item is currently unavailable: " + mi.getName());
                }
            }
            inventoryMetrics.incrementReservationSuccess();

            double total = cart.getTotalAmount();
            double coinsToUse = 0.0;
            
            // Handle FoodIQ Coins redemption
            if (request.isUseCoins()) {
                Wallet wallet = walletService.getWalletByUserId(customerId);
                coinsToUse = Math.min(wallet.getBalance(), total); 
                walletService.spendCoins(customerId, coinsToUse);
                total -= coinsToUse;
                log.info("Used {} FoodIQ Coins for user {}. New total: {}", coinsToUse, customerId, total);
            }

            if (total < restaurant.getMinOrderAmount()) {
                throw new BusinessException("Minimum order amount is ₹" + restaurant.getMinOrderAmount());
            }

            // 2. Process payment
            paymentMetrics.incrementAttempts();
            long paymentStart = System.currentTimeMillis();
            PaymentResponse payment;
            try {
                payment = paymentService.processPayment(
                        null, total, request.getPaymentMethod(), request.getPaymentToken());
            } catch (Exception e) {
                paymentMetrics.incrementFailed();
                throw e;
            }
            paymentMetrics.recordPaymentLatency(request.getPaymentMethod(), Duration.ofMillis(System.currentTimeMillis() - paymentStart));

            if (PaymentStatus.FAILED.name().equals(payment.getStatus())) {
                paymentMetrics.incrementFailed();
                throw new BusinessException("Payment failed: " + payment.getMessage());
            }
            paymentMetrics.incrementSuccess();

            // 3. Build Order entity
            User customer = userRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", customerId));

            Order order = Order.builder()
                    .customer(customer)
                    .restaurantId(restaurantId)
                    .deliveryAddress(request.getDeliveryAddress())
                    .totalAmount(total)
                    .paymentStatus(PaymentStatus.valueOf(payment.getStatus()))
                    .paymentMethod(request.getPaymentMethod())
                    .paymentId(payment.getPaymentId())
                    .specialInstructions(request.getSpecialInstructions())
                    .status(OrderStatus.PLACED)
                    .coinsUsed(coinsToUse)
                    .finalAmount(total)
                    .build();

            // 4. Convert cart items → order items 
            List<OrderItem> orderItems = cart.getItems().stream()
                    .map(ci -> OrderItem.builder()
                            .order(order)
                            .menuItemId(ci.getMenuItemId())
                            .quantity(ci.getQuantity())
                            .priceAtOrderTime(ci.getPrice())
                            .build())
                    .collect(Collectors.toList());
            order.setOrderItems(orderItems);

            Order saved = orderRepository.save(order);
            orderMetrics.incrementCreated();

            // 5. Clear cart
            cartService.clearCart(customerId);

            // 6. Reward Loyalty Coins (1% cashback)
            double rewardCoins = Math.floor(total * 0.01); 
            if (rewardCoins > 0) {
                walletService.addCoins(customerId, rewardCoins);
            }

            log.info("Order placed: id={} customer={} amount={} (Rewards: {})", saved.getId(), customerId, total, rewardCoins);
            
            kafkaService.sendMessage("order-events", 
                String.format("{\"orderId\": %d, \"customerId\": %d, \"restaurantId\": \"%s\", \"total\": %f, \"status\": \"PLACED\", \"timestamp\": %d}", 
                saved.getId(), customerId, restaurantId, total, System.currentTimeMillis()));

            OrderResponse response = toResponse(saved, restaurant.getName());

            // Notify user via WebSocket
            String userDestination = "/topic/order/" + customerId;
            messagingTemplate.convertAndSend(userDestination, response);
            log.info("WebSocket order placed notification sent to user {}", userDestination);

            // Notify admin via WebSocket
            String adminDestination = "/topic/admin/orders";
            messagingTemplate.convertAndSend(adminDestination, response);
            log.info("WebSocket order placed notification sent to admin {}", adminDestination);

            // Email dispatch is delegated to the Kafka 'order-events' consumer to ensure asynchronous processing.

            return response;
        } catch (Exception e) {
            orderMetrics.incrementFailed();
            throw e;
        }
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatusStr) {
        Order order = findById(orderId);
        OrderStatus newStatus = parseStatus(newStatusStr);
        validateStatusTransition(order.getStatus(), newStatus);

        OrderStatus currentStatus = order.getStatus();
        LocalDateTime lastUpdated = order.getUpdatedDate();
        if (lastUpdated != null) {
            Duration duration = Duration.between(lastUpdated, LocalDateTime.now());
            orderMetrics.recordTransitionDuration(currentStatus.name(), newStatus.name(), duration);
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        log.info("Order {} status → {}", orderId, newStatus);

        if (newStatus == OrderStatus.CONFIRMED) {
            orderMetrics.incrementConfirmed();
        } else if (newStatus == OrderStatus.DELIVERED) {
            orderMetrics.incrementCompleted();
        }

        kafkaService.sendOrderStatusUpdate(orderId, newStatus.name());

        Restaurant restaurant = restaurantService.findById(order.getRestaurantId());
        OrderResponse response = toResponse(updated, restaurant.getName());

        // Notify user via WebSocket
        String destination = "/topic/order/" + order.getCustomer().getId();
        messagingTemplate.convertAndSend(destination, response);
        log.info("WebSocket notification sent to {}", destination);

        // Notify admin via WebSocket
        String adminDestination = "/topic/admin/orders";
        messagingTemplate.convertAndSend(adminDestination, response);
        log.info("WebSocket status update sent to admin {}", adminDestination);

        // Email dispatch is delegated to the Kafka 'order-updates' consumer.

        return response;
    }


    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long requestingUserId) {
        Order order = findById(orderId);

        if (!order.getCustomer().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You are not allowed to cancel this order.");
        }

        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY ||
                order.getStatus() == OrderStatus.DELIVERED) {
            throw new BusinessException("Cannot cancel order that is already " + order.getStatus());
        }

        OrderStatus currentStatus = order.getStatus();
        LocalDateTime lastUpdated = order.getUpdatedDate();
        if (lastUpdated != null) {
            Duration duration = Duration.between(lastUpdated, LocalDateTime.now());
            orderMetrics.recordTransitionDuration(currentStatus.name(), OrderStatus.CANCELLED.name(), duration);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderMetrics.incrementCancelled();

        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            paymentService.processRefund(order.getPaymentId(), order.getTotalAmount());
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        Restaurant restaurant = restaurantService.findById(order.getRestaurantId());
        return toResponse(orderRepository.save(order), restaurant.getName());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Long requestingUserId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        User user = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", requestingUserId));

        boolean isCustomer = order.getCustomer().getId().equals(requestingUserId);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isDeliveryPartner = false;
        if (order.getDelivery() != null && order.getDelivery().getDeliveryPartner() != null) {
            isDeliveryPartner = order.getDelivery().getDeliveryPartner().getUser().getId().equals(requestingUserId);
        }

        if (!isCustomer && !isAdmin && !isDeliveryPartner) {
            throw new UnauthorizedException("Access denied to order: " + orderId);
        }
        Restaurant restaurant = restaurantService.findById(order.getRestaurantId());
        return toResponse(order, restaurant.getName());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrderHistory(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedDateDesc(customerId)
                .stream().map(o -> {
                    Restaurant r = restaurantService.findById(o.getRestaurantId());
                    return toResponse(o, r.getName());
                }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurant(String restaurantId) {
        Restaurant r = restaurantService.findById(restaurantId);
        return orderRepository.findByRestaurantIdOrderByCreatedDateDesc(restaurantId)
                .stream().map(o -> toResponse(o, r.getName())).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(o -> {
                    Restaurant r = restaurantService.findById(o.getRestaurantId());
                    return toResponse(o, r.getName());
                }).collect(Collectors.toList());
    }

    public Order findById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    private OrderStatus parseStatus(String status) {
        try {
            return OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid order status: " + status);
        }
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.DELIVERED) {
            throw new BusinessException("Cannot change status of a " + current + " order.");
        }
        if (next == OrderStatus.CANCELLED) return;  

        int currentOrdinal = current.ordinal();
        int nextOrdinal    = next.ordinal();
        if (nextOrdinal != currentOrdinal + 1) {
            throw new BusinessException(
                    "Invalid status transition: " + current + " → " + next);
        }
    }

    public OrderResponse toResponse(Order o, String restaurantName) {
        List<OrderItemResponse> itemResponses = o.getOrderItems().stream()
                .map(i -> {
                    MenuItem mi = menuItemService.findById(i.getMenuItemId());
                    return OrderItemResponse.builder()
                            .id(i.getId())
                            .menuItemId(i.getMenuItemId())
                            .menuItemName(mi.getName())
                            .menuItemImage(mi.getImageUrl())
                            .quantity(i.getQuantity())
                            .priceAtOrderTime(i.getPriceAtOrderTime())
                            .subtotal(i.getSubtotal())
                            .build();
                })
                .collect(Collectors.toList());

        DeliveryResponse deliveryResponse = null;
        if (o.getDelivery() != null) {
            Delivery d = o.getDelivery();
            deliveryResponse = DeliveryResponse.builder()
                    .id(d.getId())
                    .orderId(o.getId())
                    .deliveryPartnerId(d.getDeliveryPartner() != null
                            ? d.getDeliveryPartner().getId() : null)
                    .deliveryPartnerName(d.getDeliveryPartner() != null
                            ? d.getDeliveryPartner().getUser().getName() : null)
                    .deliveryPartnerPhone(d.getDeliveryPartner() != null
                            ? d.getDeliveryPartner().getUser().getPhone() : null)
                    .status(d.getStatus().name())
                    .currentLatitude(d.getCurrentLatitude())
                    .currentLongitude(d.getCurrentLongitude())
                    .assignedAt(d.getAssignedAt())
                    .acceptedAt(d.getAcceptedAt())
                    .pickedUpAt(d.getPickedUpAt())
                    .deliveredAt(d.getDeliveredAt())
                    .build();
        }

        Restaurant restaurant = restaurantService.findById(o.getRestaurantId());
        String restaurantAddress = restaurant != null ? restaurant.getAddress() : null;
        String restaurantPhone = restaurant != null ? restaurant.getPhone() : null;

        return OrderResponse.builder()
                .id(o.getId())
                .customerId(o.getCustomer().getId())
                .customerName(o.getCustomer().getName())
                .customerPhone(o.getCustomer().getPhone())
                .restaurantId(o.getRestaurantId())
                .restaurantName(restaurantName)
                .restaurantAddress(restaurantAddress)
                .restaurantPhone(restaurantPhone)
                .orderItems(itemResponses)
                .status(o.getStatus().name())
                .totalAmount(o.getTotalAmount())
                .deliveryAddress(o.getDeliveryAddress())
                .paymentStatus(o.getPaymentStatus().name())
                .paymentMethod(o.getPaymentMethod())
                .paymentId(o.getPaymentId())
                .specialInstructions(o.getSpecialInstructions())
                .coinsUsed(o.getCoinsUsed())
                .finalAmount(o.getFinalAmount())
                .delivery(deliveryResponse)
                .createdAt(o.getCreatedDate())
                .updatedAt(o.getUpdatedDate())
                .build();
    }
}
