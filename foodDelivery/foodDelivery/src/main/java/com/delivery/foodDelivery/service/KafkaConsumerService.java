package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.config.KafkaConfig;
import com.delivery.foodDelivery.dto.SaleEventDTO;
import com.delivery.foodDelivery.dto.FestivalGreetingDTO;
import com.delivery.foodDelivery.dto.UserBehaviorEventDto;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.observability.metrics.KafkaMetrics;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final KafkaMetrics kafkaMetrics;
    private final ObjectMapper objectMapper;
    private final TasteSignalProcessor tasteSignalProcessor;
    private final DigitalTwinService digitalTwinService;

    /**
     * Listener for Sale Events.
     * When a sale starts, it fetches all active users and triggers email notifications.
     */
    @KafkaListener(
            topics = KafkaConfig.SALE_TOPIC, 
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeSaleEvent(SaleEventDTO saleEvent) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed sale event: {}", saleEvent.getTitle());

        try {
            int pageSize = 50; // Smaller batch size to prevent OOM on Render
            int pageNumber = 0;
            Page<User> userPage;

            do {
                Pageable pageable = PageRequest.of(pageNumber, pageSize);
                userPage = userRepository.findByActiveTrue(pageable); 

                log.info("Processing batch {} with {} active users", pageNumber, userPage.getNumberOfElements());

                userPage.getContent().forEach(user -> {
                    if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                        emailService.sendSaleNotificationEmail(user.getEmail(), user.getName(), saleEvent);
                    }
                });

                pageNumber++;
                // Small pause to give JVM/GC breathing room
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                
            } while (userPage.hasNext());

            log.info("Completed processing all users for sale: {}", saleEvent.getTitle());
            kafkaMetrics.incrementConsumed(KafkaConfig.SALE_TOPIC, "SALE_EVENT", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed sale event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.SALE_TOPIC, "SALE_EVENT", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.SALE_TOPIC, "SALE_EVENT", "ERROR");
            throw e;
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.SALE_TOPIC, "SALE_EVENT", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    /**
     * DLT Listener for failed events
     */
    @KafkaListener(
            topics = KafkaConfig.SALE_DLT_TOPIC, 
            groupId = "email-service-dlt-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeDlt(SaleEventDTO saleEvent) {
        log.error("EVENT MOVED TO DLT: {}", saleEvent);
        kafkaMetrics.incrementConsumed(KafkaConfig.SALE_DLT_TOPIC, "SALE_DLT", "SUCCESS");
    }

    /**
     * Listener for Authentication/Verification Events (OTP, Welcome Email).
     */
    @KafkaListener(
            topics = KafkaConfig.AUTH_TOPIC,
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeAuthEvent(String message) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed Auth event: {}", message);
        try {
            Map<String, String> payload = objectMapper.readValue(message, Map.class);
            String action = payload.get("action");
            String email = payload.get("email");
            if ("OTP_REQUEST".equals(action)) {
                String otp = payload.get("otp");
                emailService.sendVerificationEmail(email, otp);
            } else if ("USER_REGISTER".equals(action)) {
                String name = payload.get("name");
                emailService.sendWelcomeEmail(email, name);
            } else if ("LOGIN_ALERT".equals(action)) {
                String name = payload.get("name");
                String ipAddress = payload.get("ipAddress");
                String userAgent = payload.get("userAgent");
                emailService.sendLoginAlertEmail(email, name, ipAddress, userAgent);
            }
            kafkaMetrics.incrementConsumed(KafkaConfig.AUTH_TOPIC, "AUTH_EVENT", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed Auth event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.AUTH_TOPIC, "AUTH_EVENT", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.AUTH_TOPIC, "AUTH_EVENT", "ERROR");
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.AUTH_TOPIC, "AUTH_EVENT", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    /**
     * Listener for Order Placement Events. Sends customer confirmation and admin notification.
     */
    @KafkaListener(
            topics = KafkaConfig.ORDER_EVENTS_TOPIC,
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeOrderEvents(String message) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed Order Placement event: {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, Map.class);
            Long orderId = ((Number) payload.get("orderId")).longValue();
            Long customerId = ((Number) payload.get("customerId")).longValue();
            double total = ((Number) payload.get("total")).doubleValue();
            
            User customer = userRepository.findById(customerId).orElse(null);
            if (customer != null && customer.getEmail() != null) {
                // Send confirmation email to customer
                emailService.sendOrderUpdateEmail(customer.getEmail(), customer.getName(), orderId, "PLACED");
                
                // Send alert email to admins
                List<User> admins = userRepository.findByRole(Role.ADMIN);
                for (User admin : admins) {
                    if (admin.getEmail() != null && !admin.getEmail().isEmpty()) {
                        emailService.sendAdminOrderNotification(admin.getEmail(), admin.getName(), orderId, customer.getName(), total);
                    }
                }
            }
            kafkaMetrics.incrementConsumed(KafkaConfig.ORDER_EVENTS_TOPIC, "ORDER_EVENT", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed Order placement event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.ORDER_EVENTS_TOPIC, "ORDER_EVENT", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.ORDER_EVENTS_TOPIC, "ORDER_EVENT", "ERROR");
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.ORDER_EVENTS_TOPIC, "ORDER_EVENT", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    /**
     * Listener for Order Status Updates (PREPARING, READY_FOR_PICKUP, etc.)
     */
    @KafkaListener(
            topics = KafkaConfig.ORDER_UPDATES_TOPIC,
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeOrderUpdates(String message) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed Order Status Update event: {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, Map.class);
            Long orderId = ((Number) payload.get("orderId")).longValue();
            String status = (String) payload.get("status");
            
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getCustomer() != null && order.getCustomer().getEmail() != null) {
                emailService.sendOrderUpdateEmail(order.getCustomer().getEmail(), order.getCustomer().getName(), orderId, status);
            }
            kafkaMetrics.incrementConsumed(KafkaConfig.ORDER_UPDATES_TOPIC, "ORDER_UPDATE", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed Order status update event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.ORDER_UPDATES_TOPIC, "ORDER_UPDATE", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.ORDER_UPDATES_TOPIC, "ORDER_UPDATE", "ERROR");
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.ORDER_UPDATES_TOPIC, "ORDER_UPDATE", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    /**
     * Listener for Daily Meal Reminders.
     */
    @KafkaListener(
            topics = KafkaConfig.DAILY_REMINDERS_TOPIC,
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeDailyReminders(String message) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed Daily Reminder event: {}", message);
        try {
            Map<String, String> payload = objectMapper.readValue(message, Map.class);
            String email = payload.get("email");
            String name = payload.get("name");
            emailService.sendDailyReminderEmail(email, name);
            kafkaMetrics.incrementConsumed(KafkaConfig.DAILY_REMINDERS_TOPIC, "DAILY_REMINDER", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed Daily reminder event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.DAILY_REMINDERS_TOPIC, "DAILY_REMINDER", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.DAILY_REMINDERS_TOPIC, "DAILY_REMINDER", "ERROR");
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.DAILY_REMINDERS_TOPIC, "DAILY_REMINDER", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    /**
     * Listener for Festival Greeting Events.
     */
    @KafkaListener(
            topics = KafkaConfig.GREETINGS_TOPIC,
            groupId = "email-service-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeFestivalGreeting(FestivalGreetingDTO greetingEvent) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed festival greeting event: {}", greetingEvent.getTitle());

        try {
            int pageSize = 50; 
            int pageNumber = 0;
            Page<User> userPage;

            do {
                Pageable pageable = PageRequest.of(pageNumber, pageSize);
                userPage = userRepository.findByActiveTrue(pageable); 

                log.info("Processing batch {} with {} active users for festival greeting", pageNumber, userPage.getNumberOfElements());

                userPage.getContent().forEach(user -> {
                    if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                        emailService.sendFestivalGreetingEmail(
                            user.getEmail(), 
                            user.getName(), 
                            greetingEvent.getTitle(), 
                            greetingEvent.getMessage(), 
                            greetingEvent.getFestivalName()
                        );
                    }
                });

                pageNumber++;
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                
            } while (userPage.hasNext());

            log.info("Completed processing all users for festival greeting: {}", greetingEvent.getTitle());
            kafkaMetrics.incrementConsumed(KafkaConfig.GREETINGS_TOPIC, "FESTIVAL_GREETING", "SUCCESS");
        } catch (Exception e) {
            log.error("Error processing consumed festival greeting event: {}", e.getMessage());
            kafkaMetrics.incrementErrors(KafkaConfig.GREETINGS_TOPIC, "FESTIVAL_GREETING", e.getClass().getSimpleName());
            kafkaMetrics.incrementConsumed(KafkaConfig.GREETINGS_TOPIC, "FESTIVAL_GREETING", "ERROR");
            throw e;
        } finally {
            kafkaMetrics.recordProcessingTime(KafkaConfig.GREETINGS_TOPIC, "FESTIVAL_GREETING", Duration.ofMillis(System.currentTimeMillis() - startTime));
        }
    }

    @KafkaListener(
            topics = {
                KafkaConfig.USER_BEHAVIOR_TOPIC,
                KafkaConfig.ORDER_COMPLETED_TOPIC,
                KafkaConfig.ORDER_RATED_TOPIC,
                KafkaConfig.CART_EVENTS_TOPIC,
                KafkaConfig.RECOMMENDATION_EVENTS_TOPIC
            },
            groupId = "taste-dna-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeTasteDnaEvent(String message) {
        long startTime = System.currentTimeMillis();
        log.info("Consumed Taste DNA event: {}", message);
        try {
            UserBehaviorEventDto eventDto = objectMapper.readValue(message, UserBehaviorEventDto.class);
            tasteSignalProcessor.processEvent(eventDto);
        } catch (Exception e) {
            log.error("Error processing consumed Taste DNA event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(
            topics = {
                KafkaConfig.KITCHEN_STARTED_TOPIC,
                KafkaConfig.KITCHEN_COMPLETED_TOPIC,
                KafkaConfig.INVENTORY_UPDATED_TOPIC,
                KafkaConfig.INVENTORY_LOW_TOPIC,
                KafkaConfig.RESTAURANT_STATUS_TOPIC,
                KafkaConfig.RESTAURANT_PROMOTION_TOPIC,
                KafkaConfig.DELIVERY_UPDATED_TOPIC,
                KafkaConfig.WEATHER_UPDATED_TOPIC,
                KafkaConfig.FORECAST_GENERATED_TOPIC,
                KafkaConfig.DIGITAL_TWIN_UPDATED_TOPIC
            },
            groupId = "digital-twin-group",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeDigitalTwinEvent(String message) {
        log.info("Consumed Digital Twin event: {}", message);
        try {
            com.delivery.foodDelivery.dto.DigitalTwinEventDto eventDto = objectMapper.readValue(
                message, com.delivery.foodDelivery.dto.DigitalTwinEventDto.class
            );
            digitalTwinService.processEvent(eventDto);
        } catch (Exception e) {
            log.error("Error processing consumed Digital Twin event: {}", e.getMessage(), e);
        }
    }
}
