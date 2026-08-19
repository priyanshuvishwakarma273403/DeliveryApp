package com.delivery.foodDelivery.support.conversation.service;

import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.OtpService;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneAuthenticationService {

    private final UserRepository userRepository;
    private final OtpService otpService;

    /**
     * Initiates authentication by sending an OTP to the customer's registered email/SMS
     * associated with the provided phone number.
     * @param session Active CallSession
     * @param rawPhoneNumber The registered phone number input by the user
     * @return true if phone number matched a user and OTP was sent, false otherwise
     */
    public boolean initiateAuth(CallSession session, String rawPhoneNumber) {
        String normalized = CallSessionManager.normalizePhone(rawPhoneNumber);
        if (normalized == null || normalized.isEmpty()) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByPhone(normalized);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByPhone("+91" + normalized);
        }
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByPhone("91" + normalized);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            session.setUserId(user.getId());
            session.setUserName(user.getName());
            
            // Generate OTP for user's email (as a proxy for SMS in local/dev setup)
            String otp = otpService.generateOtp(user.getEmail());
            session.setAuthOtpCode(otp);
            session.setAuthAttempts(0);
            
            log.info("OTP sent to {} for phone auth. Code: {}", user.getEmail(), otp);
            return true;
        }
        
        return false;
    }

    /**
     * Verifies the OTP entered/spoken by the caller.
     * @param session Active CallSession
     * @param enteredOtp OTP digits
     * @return true if verified successfully, false otherwise
     */
    public boolean verifyOtp(CallSession session, String enteredOtp) {
        if (session.getUserId() == null || session.getAuthOtpCode() == null) {
            return false;
        }

        Optional<User> userOpt = userRepository.findById(session.getUserId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            boolean verified = otpService.verifyOtp(user.getEmail(), enteredOtp);
            if (verified) {
                session.setAuthenticated(true);
                session.setAuthOtpCode(null); // Clear OTP
                log.info("Call session {} authenticated successfully for user {}", session.getCallSid(), user.getName());
                return true;
            } else {
                session.setAuthAttempts(session.getAuthAttempts() + 1);
                log.warn("Incorrect OTP attempt #{} for call session {}", session.getAuthAttempts(), session.getCallSid());
            }
        }

        return false;
    }
}
