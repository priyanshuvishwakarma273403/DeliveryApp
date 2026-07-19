package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreference {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Builder.Default
    @Column(name = "push_enabled")
    private boolean pushEnabled = true;

    @Builder.Default
    @Column(name = "email_enabled")
    private boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "sms_enabled")
    private boolean smsEnabled = false;

    @Builder.Default
    @Column(name = "whatsapp_enabled")
    private boolean whatsappEnabled = false;

    @Builder.Default
    @Column(name = "marketing_enabled")
    private boolean marketingEnabled = true;

    @Builder.Default
    @Column(name = "order_updates_enabled")
    private boolean orderUpdatesEnabled = true;

    @Builder.Default
    @Column(name = "payment_alerts_enabled")
    private boolean paymentAlertsEnabled = true;

    @Builder.Default
    @Column(name = "offers_enabled")
    private boolean offersEnabled = true;

    @Builder.Default
    @Column(name = "security_alerts_enabled")
    private boolean securityAlertsEnabled = true;

    @Builder.Default
    @Column(name = "newsletter_enabled")
    private boolean newsletterEnabled = false;
}
