package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.SaleEventDTO;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.entity.User;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    
    public void sendVerificationEmail(String toEmail, String otp) {
        try {
            log.info("Attempting to send verification OTP to: {}", toEmail);
            
            // Check if email credentials are configured
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("Your FoodDelivery Verification OTP");
            helper.setText("<h1>Welcome to FoodDelivery!</h1>" +
                    "<p>Your verification code is: <strong>" + otp + "</strong></p>" +
                    "<p>This code is valid for 5 minutes.</p>", true);

            mailSender.send(message);
            log.info("OTP sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("****************************************************************");
            log.error("EMAIL SENDING FAILED: {}", e.getMessage());
            log.error("OTP for {}: {}", toEmail, otp);
            log.error("Please configure spring.mail.username/password in application.properties");
            log.error("DEVELOPMENT TIP: Use master OTP '123456' to bypass this.");
            log.error("****************************************************************");
            // We DON'T throw exception here to allow user to proceed in local development
        }
    }


    @Async("emailExecutor")
    public void sendSaleNotificationEmail(String toEmail, String userName, SaleEventDTO saleEvent) {
        try {
            log.info("Sending email to: {}", toEmail);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, 
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, 
                    StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; }" +
                    "  .header { background: linear-gradient(135deg, #FF9933 0%, #FF5500 100%); color: white; padding: 40px 20px; text-align: center; }" +
                    "  .header h1 { margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }" +
                    "  .content { padding: 30px; background-color: #ffffff; color: #333; line-height: 1.6; }" +
                    "  .sale-box { background: #FFF8E1; border: 2px dashed #FF9933; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }" +
                    "  .promo-code { font-size: 24px; font-weight: bold; color: #D32F2F; letter-spacing: 2px; }" +
                    "  .discount { font-size: 48px; font-weight: 800; color: #FF5500; margin: 10px 0; }" +
                    "  .btn { display: inline-block; padding: 15px 30px; background-color: #FF5500; color: white !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 15px rgba(255,85,0,0.3); }" +
                    "  .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }" +
                    "  .diya { font-size: 40px; margin-bottom: 10px; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'>" +
                    "      <div class='diya'>🪔✨🪔</div>" +
                    "      <h1>" + saleEvent.getTitle() + "</h1>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <h3>Namaste " + userName + "!</h3>" +
                    "      <p>" + saleEvent.getMessage() + "</p>" +
                    "      <div class='sale-box'>" +
                    "        <p style='margin:0; font-weight:600; color:#555;'>GET AN EXCLUSIVE</p>" +
                    "        <div class='discount'>" + String.format("%.0f%% OFF", saleEvent.getDiscountPercentage()) + "</div>" +
                    "        <p style='margin:5px 0;'>Use Code: <span class='promo-code'>" + saleEvent.getPromoCode() + "</span></p>" +
                    "      </div>" +
                    "      <p style='text-align:center;'>" +
                    "        <a href='https://foodiq-food.app' class='btn'>Order Now & Celebrate!</a>" +
                    "      </p>" +
                    "      <p>Wishing you and your family a very Happy and Prosperous Diwali! May your plate always be full of joy and delicious food.</p>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p>&copy; 2026 FoodIQ Food Delivery. All Rights Reserved.</p>" +
                    "      <p>If you have any questions, contact us at support@foodiq.com</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("🪔 Special Diwali Offer: " + saleEvent.getTitle() + " 🪔");
            helper.setText(content, true);


            mailSender.send(message);
            log.info("Successfully sent email to: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            // In a real scenario, you might want to re-throw or handle differently
        }
    }

    @Async("emailExecutor")
    public void sendOrderUpdateEmail(String toEmail, String userName, Long orderId, String status) {
        try {
            log.info("Sending order update email to: {} for order #{} status: {}", toEmail, orderId, status);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String title = "";
            String emoji = "";
            String bodyMessage = "";
            String headerColor = "#FF5500";
            String statusStep = "";
            
            switch (status.toUpperCase()) {
                case "PLACED":
                    title = "Order Confirmed!";
                    emoji = "✅";
                    headerColor = "#4CAF50";
                    bodyMessage = "Great news! Your order <strong>#" + orderId + "</strong> has been successfully placed. The restaurant will start preparing your delicious food soon.";
                    statusStep = buildProgressBar(1);
                    break;
                case "CONFIRMED":
                    title = "Order Accepted by Restaurant!";
                    emoji = "👨‍🍳";
                    headerColor = "#2196F3";
                    bodyMessage = "The restaurant has accepted your order <strong>#" + orderId + "</strong>! They'll begin preparing it shortly.";
                    statusStep = buildProgressBar(2);
                    break;
                case "PREPARING":
                    title = "Your Food is Being Prepared!";
                    emoji = "🍳";
                    headerColor = "#FF9800";
                    bodyMessage = "The chef is preparing your order <strong>#" + orderId + "</strong> with love. Fresh and hot food is on its way!";
                    statusStep = buildProgressBar(3);
                    break;
                case "PACKED":
                    title = "Order Packed & Ready!";
                    emoji = "📦";
                    headerColor = "#9C27B0";
                    bodyMessage = "Your order <strong>#" + orderId + "</strong> has been packed and is ready for pickup by the delivery partner.";
                    statusStep = buildProgressBar(4);
                    break;
                case "READY_FOR_PICKUP":
                    title = "Waiting for Delivery Partner!";
                    emoji = "🏪";
                    headerColor = "#00BCD4";
                    bodyMessage = "Your order <strong>#" + orderId + "</strong> is ready and waiting for a delivery partner to pick it up.";
                    statusStep = buildProgressBar(5);
                    break;
                case "OUT_FOR_DELIVERY":
                    title = "Order is On the Way!";
                    emoji = "🛵";
                    headerColor = "#E91E63";
                    bodyMessage = "Get ready! Your order <strong>#" + orderId + "</strong> has been picked up and is on its way to you. The delivery partner is en route!";
                    statusStep = buildProgressBar(6);
                    break;
                case "DELIVERED":
                    title = "Order Delivered Successfully!";
                    emoji = "🍽️";
                    headerColor = "#4CAF50";
                    bodyMessage = "Your order <strong>#" + orderId + "</strong> has been delivered safely. Enjoy your meal! Don't forget to rate your experience.";
                    statusStep = buildProgressBar(7);
                    break;
                case "CANCELLED":
                    title = "Order Cancelled";
                    emoji = "❌";
                    headerColor = "#F44336";
                    bodyMessage = "Your order <strong>#" + orderId + "</strong> has been cancelled. If you were charged, a refund will be processed within 3-5 business days.";
                    statusStep = "";
                    break;
                default:
                    title = "Order Update";
                    emoji = "🔔";
                    bodyMessage = "Your order <strong>#" + orderId + "</strong> status is now: <strong>" + status + "</strong>.";
                    statusStep = "";
                    break;
            }

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  * { margin: 0; padding: 0; box-sizing: border-box; }" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }" +
                    "  .header { background: " + headerColor + "; color: white; padding: 35px 20px; text-align: center; }" +
                    "  .header .emoji { font-size: 52px; margin-bottom: 10px; display: block; }" +
                    "  .header h1 { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }" +
                    "  .content { padding: 30px; background-color: #ffffff; color: #333; line-height: 1.8; }" +
                    "  .greeting { font-size: 18px; font-weight: 600; color: #222; margin-bottom: 15px; }" +
                    "  .message { font-size: 15px; color: #555; margin-bottom: 25px; }" +
                    "  .progress-container { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; }" +
                    "  .progress-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }" +
                    "  .progress-bar { display: flex; justify-content: space-between; align-items: center; position: relative; }" +
                    "  .step { text-align: center; flex: 1; position: relative; z-index: 1; }" +
                    "  .step-dot { width: 28px; height: 28px; border-radius: 50%; margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white; }" +
                    "  .step-dot.active { background: " + headerColor + "; }" +
                    "  .step-dot.inactive { background: #ddd; color: #999; }" +
                    "  .step-label { font-size: 9px; color: #888; font-weight: 500; }" +
                    "  .step-label.active { color: " + headerColor + "; font-weight: 700; }" +
                    "  .divider { height: 1px; background: #eee; margin: 20px 0; }" +
                    "  .info-box { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; border-radius: 0 8px 8px 0; margin: 15px 0; }" +
                    "  .info-box p { font-size: 13px; color: #666; margin: 0; }" +
                    "  .footer { background: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eee; }" +
                    "  .footer p { font-size: 12px; color: #aaa; margin: 3px 0; }" +
                    "  .footer .brand { color: #FF5500; font-weight: 700; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'>" +
                    "      <span class='emoji'>" + emoji + "</span>" +
                    "      <h1>" + title + "</h1>" +
                    "    </div>" +
                    "    <div class='content'>" +
                    "      <p class='greeting'>Hello " + userName + "! 👋</p>" +
                    "      <p class='message'>" + bodyMessage + "</p>" +
                    statusStep +
                    "      <div class='divider'></div>" +
                    "      <div class='info-box'>" +
                    "        <p>📞 Need help? Contact our support team anytime.</p>" +
                    "      </div>" +
                    "      <p style='text-align:center; margin-top:15px; font-size:14px; color:#888;'>Thank you for choosing <strong style='color:#FF5500;'>FoodIQ Food Delivery</strong>! 🧠</p>" +
                    "    </div>" +
                    "    <div class='footer'>" +
                    "      <p>&copy; 2026 <span class='brand'>FoodIQ Food Delivery</span>. All Rights Reserved.</p>" +
                    "      <p>Made with ❤️ for food lovers</p>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("FoodIQ Food - " + emoji + " " + title);
            helper.setText(content, true);

            mailSender.send(message);
            log.info("Successfully sent order email to: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Failed to send order email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildProgressBar(int currentStep) {
        String[] labels = {"Placed", "Confirmed", "Preparing", "Packed", "Ready", "On Way", "Delivered"};
        StringBuilder sb = new StringBuilder();
        sb.append("<div class='progress-container'>");
        sb.append("<p class='progress-title'>Order Progress</p>");
        sb.append("<div class='progress-bar'>");
        for (int i = 0; i < labels.length; i++) {
            boolean active = (i + 1) <= currentStep;
            String dotClass = active ? "active" : "inactive";
            String labelClass = active ? "active" : "";
            String checkOrNum = active ? "✓" : String.valueOf(i + 1);
            sb.append("<div class='step'>");
            sb.append("<div class='step-dot ").append(dotClass).append("'>").append(checkOrNum).append("</div>");
            sb.append("<div class='step-label ").append(labelClass).append("'>").append(labels[i]).append("</div>");
            sb.append("</div>");
        }
        sb.append("</div>");
        sb.append("</div>");
        return sb.toString();
    }

    @Async("emailExecutor")
    public void sendLoginAlertEmail(String toEmail, String userName, String ipAddress, String userAgent) {
        try {
            log.info("Sending login alert email to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }" +
                    "  .header { background: linear-gradient(135deg, #111827 0%, #1F2937 100%); color: white; padding: 25px 20px; text-align: center; }" +
                    "  .header h2 { margin: 0; font-size: 22px; }" +
                    "  .content { padding: 30px; line-height: 1.8; color: #374151; background: #ffffff; }" +
                    "  .details { background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #111827; font-size: 14px; }" +
                    "  .footer { background-color: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'><h2>Security Alert: New Login Detected</h2></div>" +
                    "    <div class='content'>" +
                    "      <p>Hello <strong>" + userName + "</strong>,</p>" +
                    "      <p>We noticed a new login to your FoodIQ account. Here are the details:</p>" +
                    "      <div class='details'>" +
                    "        <strong>Email:</strong> " + toEmail + "<br/>" +
                    "        <strong>Time:</strong> " + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "<br/>" +
                    "        <strong>IP Address:</strong> " + (ipAddress != null ? ipAddress : "Unknown IP") + "<br/>" +
                    "        <strong>Device/Client:</strong> " + (userAgent != null ? userAgent : "Unknown Device") + "<br/>" +
                    "      </div>" +
                    "      <p>If this was you, no action is needed. If you did not log in, please reset your password immediately to protect your account.</p>" +
                    "    </div>" +
                    "    <div class='footer'>&copy; 2026 FoodIQ Food Delivery. All Rights Reserved.</div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("🔒 Security Alert: New login to FoodIQ");
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send login alert email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            log.info("Sending welcome email to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }" +
                    "  .header { background: linear-gradient(135deg, #FF5500 0%, #FF9933 100%); color: white; padding: 35px 20px; text-align: center; }" +
                    "  .header h1 { margin: 0; font-size: 28px; font-weight: 800; }" +
                    "  .content { padding: 30px; line-height: 1.8; color: #374151; background: #ffffff; }" +
                    "  .welcome-badge { font-size: 50px; text-align: center; margin-bottom: 20px; }" +
                    "  .btn { display: inline-block; padding: 12px 24px; background-color: #FF5500; color: white !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }" +
                    "  .footer { background-color: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'><h1>Welcome to FoodIQ! 🍔</h1></div>" +
                    "    <div class='content'>" +
                    "      <div class='welcome-badge'>🎉✨🎉</div>" +
                    "      <p>Hello <strong>" + userName + "</strong>,</p>" +
                    "      <p>We are absolutely thrilled to welcome you to the FoodIQ family! You have successfully registered your account.</p>" +
                    "      <p>Get ready to explore top-rated restaurants, enjoy lightning-fast deliveries, and earn FoodIQ loyalty coins on every single order!</p>" +
                    "      <p style='text-align:center;'><a href='http://localhost:5173' class='btn'>Explore FoodIQ</a></p>" +
                    "      <p>Happy eating!<br/>The FoodIQ Team 🧠</p>" +
                    "    </div>" +
                    "    <div class='footer'>&copy; 2026 FoodIQ Food Delivery. All Rights Reserved.</div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("👋 Welcome to FoodIQ - Let's get eating!");
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendGenericNotificationEmail(String toEmail, String userName, String subject, String body) {
        try {
            log.info("Sending generic notification email to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }" +
                    "  .header { background: linear-gradient(135deg, #FF5500 0%, #FF2200 100%); color: white; padding: 25px 20px; text-align: center; }" +
                    "  .header h2 { margin: 0; font-size: 22px; }" +
                    "  .content { padding: 30px; line-height: 1.8; color: #374151; background: #ffffff; }" +
                    "  .footer { background-color: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'><h2>" + subject + "</h2></div>" +
                    "    <div class='content'>" +
                    "      <p>Hello <strong>" + userName + "</strong>,</p>" +
                    "      <p>" + body + "</p>" +
                    "      <p>Warm regards,<br/>The FoodIQ Team 🧠</p>" +
                    "    </div>" +
                    "    <div class='footer'>&copy; 2026 FoodIQ Food Delivery. All Rights Reserved.</div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("🔔 FoodIQ Update: " + subject);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send generic notification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendDailyReminderEmail(String toEmail, String userName) {
        try {
            log.info("Sending daily reminder email to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }" +
                    "  .header { background: linear-gradient(135deg, #FF5500 0%, #FF9933 100%); color: white; padding: 30px 20px; text-align: center; }" +
                    "  .header h2 { margin: 0; font-size: 24px; }" +
                    "  .content { padding: 30px; line-height: 1.8; color: #374151; background: #ffffff; }" +
                    "  .menu-highlight { background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF5500; text-align: center; font-weight: bold; color: #D32F2F; }" +
                    "  .btn { display: inline-block; padding: 12px 24px; background-color: #FF5500; color: white !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 15px 0; }" +
                    "  .footer { background-color: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'><h2>Hungry? We've Got You Covered! 🍕</h2></div>" +
                    "    <div class='content'>" +
                    "      <p>Hello <strong>" + userName + "</strong>,</p>" +
                    "      <p>It's that time of the day! Don't let your stomach wait. Delicious meals from your favorite local kitchens are just a few taps away.</p>" +
                    "      <div class='menu-highlight'>" +
                    "        ✨ Special: Earn Double FoodIQ Coins on all orders placed within the next 2 hours! ✨" +
                    "      </div>" +
                    "      <p style='text-align:center;'><a href='http://localhost:5173' class='btn'>Order Now</a></p>" +
                    "      <p>Enjoy your meal!<br/>The FoodIQ Team</p>" +
                    "    </div>" +
                    "    <div class='footer'>&copy; 2026 FoodIQ Food Delivery. All Rights Reserved.</div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            helper.setSubject("🍽️ Hungry? Your favorite meal is waiting for you!");
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send daily reminder email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendAdminOrderNotification(String adminEmail, String adminName, Long orderId, String customerName, double amount) {
        try {
            log.info("Sending admin order notification to: {}", adminEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String content = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "  .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }" +
                    "  .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 25px 20px; text-align: center; }" +
                    "  .header h2 { margin: 0; font-size: 22px; }" +
                    "  .content { padding: 30px; line-height: 1.8; color: #374151; background: #ffffff; }" +
                    "  .details { background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #E5E7EB; }" +
                    "  .footer { background-color: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
                    "</style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='container'>" +
                    "    <div class='header'><h2>New Order Placed 🛍️</h2></div>" +
                    "    <div class='content'>" +
                    "      <p>Hello " + adminName + ",</p>" +
                    "      <p>A new order has been successfully placed on the FoodIQ platform.</p>" +
                    "      <div class='details'>" +
                    "        <strong>Order ID:</strong> #" + orderId + "<br/>" +
                    "        <strong>Customer Name:</strong> " + customerName + "<br/>" +
                    "        <strong>Total Amount:</strong> ₹" + amount + "<br/>" +
                    "        <strong>Time:</strong> " + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "<br/>" +
                    "      </div>" +
                    "      <p>Please check the admin control center to review details and track updates.</p>" +
                    "    </div>" +
                    "    <div class='footer'>&copy; 2026 FoodIQ Management Console.</div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setTo(adminEmail);
            helper.setSubject("🔔 Admin Alert: New Order #" + orderId + " Placed");
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send admin order notification to {}: {}", adminEmail, e.getMessage());
        }
    }
}
