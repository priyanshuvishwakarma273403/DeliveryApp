package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.config.KafkaConfig;
import com.delivery.foodDelivery.dto.SaleEventDTO;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.observability.metrics.KafkaMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final KafkaMetrics kafkaMetrics;

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
}
