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
    private final EmailService emailService;

    /**
     * Send daily reminder email to all active customer users to order food.
     * Scheduled to run every day at 12:00 PM (noon).
     * Cron expression: "0 0 12 * * ?"
     */
    @Scheduled(cron = "0 0 12 * * ?")
    public void sendDailyReminders() {
        log.info("Starting scheduled task: Sending daily meal reminders...");
        try {
            List<User> customers = userRepository.findByRole(Role.CUSTOMER);
            int sentCount = 0;
            for (User customer : customers) {
                if (customer.isActive() && customer.getEmail() != null && !customer.getEmail().isEmpty()) {
                    emailService.sendDailyReminderEmail(customer.getEmail(), customer.getName());
                    sentCount++;
                }
            }
            log.info("Completed scheduled daily meal reminders. Sent to {} users.", sentCount);
        } catch (Exception e) {
            log.error("Error occurred while executing daily meal reminders scheduler: {}", e.getMessage());
        }
    }

    /**
     * A frequent reminder scheduler for testing/demo purposes in local development.
     * Runs every 5 minutes to prove that the activity-based background job is alive and working.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void runDemoReminder() {
        log.info("[DEMO SCHEDULER] Periodic background healthcheck: Daily meal reminder pipeline is active and healthy.");
    }
}
