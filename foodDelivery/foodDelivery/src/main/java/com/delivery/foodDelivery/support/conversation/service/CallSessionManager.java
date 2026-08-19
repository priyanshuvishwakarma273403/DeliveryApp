package com.delivery.foodDelivery.support.conversation.service;

import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallSessionManager {

    private final UserRepository userRepository;
    private final Map<String, CallSession> sessions = new ConcurrentHashMap<>();

    /**
     * Retrieves an existing session or creates a new one, resolving caller details.
     * @param callSid Call SID from Exotel
     * @param fromPhone Caller phone number
     * @return CallSession object
     */
    public CallSession getOrCreateSession(String callSid, String fromPhone) {
        if (callSid == null) {
            log.warn("Null callSid passed. Creating transient call session.");
            return new CallSession();
        }

        return sessions.computeIfAbsent(callSid, k -> {
            log.info("Creating new call session for callSid: {}, phone: {}", callSid, fromPhone);
            String normalizedPhone = normalizePhone(fromPhone);
            CallSession.CallSessionBuilder builder = CallSession.builder()
                    .callSid(callSid)
                    .fromPhone(fromPhone);

            if (normalizedPhone != null) {
                // Try to resolve customer details from database
                Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
                if (!userOpt.isPresent()) {
                    // Try looking with country code (+91 or 91)
                    userOpt = userRepository.findByPhone("+91" + normalizedPhone);
                }
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findByPhone("91" + normalizedPhone);
                }

                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    log.info("Resolved caller customer: Name: {}, ID: {}", user.getName(), user.getId());
                    builder.userId(user.getId())
                           .userName(user.getName())
                           .authenticated(true); // Automatically authenticated if phone matches exactly
                } else {
                    log.info("Caller phone {} not matched to any registered customer.", fromPhone);
                    builder.authenticated(false);
                }
            }

            return builder.build();
        });
    }

    public CallSession getSession(String callSid) {
        return sessions.get(callSid);
    }

    public void saveSession(CallSession session) {
        if (session != null && session.getCallSid() != null) {
            sessions.put(session.getCallSid(), session);
        }
    }

    public void removeSession(String callSid) {
        if (callSid != null) {
            sessions.remove(callSid);
            log.info("Terminated and removed call session for callSid: {}", callSid);
        }
    }

    /**
     * Normalizes raw phone input to retrieve the last 10 digits.
     */
    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        String clean = raw.replaceAll("\\D", "");
        if (clean.length() >= 10) {
            return clean.substring(clean.length() - 10);
        }
        return clean;
    }
}
