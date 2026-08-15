package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DailyReminderScheduler {

    private final UserRepository userRepository;
    private final KafkaService kafkaService;

    /**
     * Morning Reminder: Scheduled to run every day at 10:00 AM.
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void sendMorningReminders() {
        log.info("Starting Morning scheduled task: Sending daily meal reminders...");
        publishDailyReminders("MORNING");
    }

    /**
     * Evening Reminder: Scheduled to run every day at 6:00 PM.
     */
    @Scheduled(cron = "0 0 18 * * ?")
    public void sendEveningReminders() {
        log.info("Starting Evening scheduled task: Sending daily meal reminders...");
        publishDailyReminders("EVENING");
    }

    private void publishDailyReminders(String batchName) {
        try {
            List<User> customers = userRepository.findByRole(Role.CUSTOMER);
            int sentCount = 0;
            for (User customer : customers) {
                if (customer.isActive() && customer.getEmail() != null && !customer.getEmail().isEmpty()) {
                    String payload = String.format("{\"email\": \"%s\", \"name\": \"%s\", \"batch\": \"%s\"}", 
                            customer.getEmail(), customer.getName(), batchName);
                    kafkaService.sendMessage("daily-reminders", payload);
                    sentCount++;
                }
            }
            log.info("Completed scheduling {} daily meal reminders to Kafka. Sent to {} users.", batchName, sentCount);
        } catch (Exception e) {
            log.error("Error occurred while executing daily meal reminders scheduler: {}", e.getMessage());
        }
    }

    /**
     * A frequent reminder scheduler for testing/demo purposes in local development.
     * Runs every 2 minutes to prove that the activity-based background job is alive and working.
     */
    @Scheduled(fixedRate = 120000) // 2 minutes
    public void runDemoReminder() {
        log.info("[DEMO SCHEDULER] Periodic background healthcheck: Triggering test reminder to Kafka...");
        try {
            userRepository.findByRole(Role.CUSTOMER).stream()
                    .filter(u -> u.isActive() && u.getEmail() != null && !u.getEmail().isEmpty())
                    .findFirst()
                    .ifPresent(customer -> {
                        String payload = String.format("{\"email\": \"%s\", \"name\": \"%s\", \"batch\": \"DEMO-TEST\"}", 
                                customer.getEmail(), customer.getName());
                        kafkaService.sendMessage("daily-reminders", payload);
                        log.info("[DEMO SCHEDULER] Dispatched test reminder for {} to daily-reminders topic", customer.getEmail());
                    });
        } catch (Exception e) {
            log.error("[DEMO SCHEDULER] Failed to dispatch test reminder: {}", e.getMessage());
        }
    }
}
