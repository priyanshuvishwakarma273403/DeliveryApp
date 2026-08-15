package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.dto.request.BroadcastRequest;
import com.delivery.foodDelivery.dto.request.NotificationRequest;
import com.delivery.foodDelivery.dto.FestivalGreetingDTO;
import com.delivery.foodDelivery.service.KafkaService;
import java.util.UUID;
import com.delivery.foodDelivery.entity.NotificationCampaign;
import com.delivery.foodDelivery.entity.NotificationMessage;
import com.delivery.foodDelivery.entity.NotificationTemplate;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.entity.UserNotificationPreference;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.mongo.NotificationCampaignRepository;
import com.delivery.foodDelivery.repository.mongo.NotificationTemplateRepository;
import com.delivery.foodDelivery.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationCampaignRepository campaignRepository;
    private final KafkaService kafkaService;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<Page<NotificationMessage>>> getInbox(
            @RequestParam(defaultValue = "ALL") String tab,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Page<NotificationMessage> messages = notificationService.getInbox(
                String.valueOf(user.getId()), tab, page, limit);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        long count = notificationService.getUnreadCount(String.valueOf(user.getId()));
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PutMapping("/inbox/{id}/{action}")
    public ResponseEntity<ApiResponse<Void>> mutateInboxItem(
            @PathVariable String id,
            @PathVariable String action) {
        
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        try {
            notificationService.updateInboxStatus(id, String.valueOf(user.getId()), action);
            return ResponseEntity.ok(ApiResponse.success("Inbox status updated successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<UserNotificationPreference>> getPreferences() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        UserNotificationPreference preferences = notificationService.getOrCreatePreferences(user.getId());
        return ResponseEntity.ok(ApiResponse.success(preferences));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<UserNotificationPreference>> updatePreferences(
            @RequestBody UserNotificationPreference newPref) {
        
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        UserNotificationPreference updated = notificationService.savePreferences(user.getId(), newPref);
        return ResponseEntity.ok(ApiResponse.success("Notification preferences saved successfully", updated));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<NotificationMessage>> sendNotification(
            @RequestBody NotificationRequest request) {
        
        try {
            NotificationMessage msg = notificationService.sendNotification(request);
            return ResponseEntity.ok(ApiResponse.success("Notification request completed", msg));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── ADMIN ONLY OPERATIONS ──

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> broadcast(@RequestBody BroadcastRequest request) {
        notificationService.broadcast(request);
        return ResponseEntity.ok(ApiResponse.success("Broadcast initiated asynchronously across channels", null));
    }

    @PostMapping("/festival-blast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> festivalBlast(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");
        String festivalName = request.get("festivalName");

        if (title == null || message == null || festivalName == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("title, message, and festivalName are required"));
        }

        FestivalGreetingDTO greeting = FestivalGreetingDTO.builder()
                .greetingId("GREET-" + UUID.randomUUID().toString().substring(0, 8))
                .title(title)
                .message(message)
                .festivalName(festivalName)
                .build();

        kafkaService.sendFestivalGreeting(greeting);

        return ResponseEntity.ok(ApiResponse.success("Festival greetings broadcast event triggered successfully.", null));
    }

    @PostMapping("/campaign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationCampaign>> createCampaign(
            @RequestBody NotificationCampaign campaign) {
        
        NotificationCampaign created = notificationService.createCampaign(campaign);
        return ResponseEntity.ok(ApiResponse.success("Campaign scheduled successfully", created));
    }

    @GetMapping("/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationCampaign>>> getCampaigns() {
        return ResponseEntity.ok(ApiResponse.success(campaignRepository.findAll()));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        Map<String, Object> stats = notificationService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationTemplate>>> getTemplates() {
        return ResponseEntity.ok(ApiResponse.success(templateRepository.findAll()));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationTemplate>> createTemplate(
            @RequestBody NotificationTemplate template) {
        
        NotificationTemplate saved = templateRepository.save(template);
        return ResponseEntity.ok(ApiResponse.success("Template configured successfully", saved));
    }
}
