package com.delivery.foodDelivery.support.orchestration.service;

import com.delivery.foodDelivery.support.config.VoiceSupportConfig;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import com.delivery.foodDelivery.support.conversation.service.PhoneAuthenticationService;
import com.delivery.foodDelivery.support.escalation.service.CallEscalationService;
import com.delivery.foodDelivery.support.tools.service.SupportToolsExecutor;
import com.delivery.foodDelivery.support.voice.service.VoiceEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoiceAiOrchestrator {

    private final VoiceSupportConfig config;
    private final PhoneAuthenticationService authService;
    private final SupportToolsExecutor toolsExecutor;
    private final CallEscalationService escalationService;
    private final VoiceEngine voiceEngine;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final Pattern TOOL_PATTERN = Pattern.compile("\\[TOOL_CALL:\\s*(\\w+)\\s*,\\s*([^\\]]+)\\]");

    /**
     * Orchestrates the call session, processing transcribed user text, 
     * executing tools if requested, and generating the response speech.
     * @param session CallSession
     * @param userSpeech Raw transcribed user speech text
     * @return Map containing:
     *         - "response_text": text response
     *         - "audio_url": URL of generated speech response
     *         - "escalated": boolean (true if transferred to human agent)
     *         - "escalation_ticket": ticket ID if escalated
     */
    public Map<String, Object> processTurn(CallSession session, String userSpeech) {
        Map<String, Object> result = new HashMap<>();
        result.put("escalated", false);

        if (userSpeech == null || userSpeech.trim().isEmpty()) {
            String silentReply = "I couldn't hear you clearly. Could you please repeat that?";
            String audioUrl = voiceEngine.synthesize(silentReply, "en");
            result.put("response_text", silentReply);
            result.put("audio_url", audioUrl);
            return result;
        }

        log.info("Processing turn for callSid={}. Authenticated={}, Input=\"{}\"", 
                session.getCallSid(), session.isAuthenticated(), userSpeech);

        // 1. STATE MACHINE: AUTHENTICATION FLOW
        if (session.getUserId() == null) {
            // Unregistered user - looking for phone number
            String digits = extractDigits(userSpeech);
            if (digits != null && digits.length() == 10) {
                boolean sent = authService.initiateAuth(session, digits);
                if (sent) {
                    String reply = "Humne aapke registered email par ek OTP bheja hai. Kripya 6-digit verification code batayein.";
                    String audio = voiceEngine.synthesize(reply, "hi");
                    result.put("response_text", reply);
                    result.put("audio_url", audio);
                    return result;
                } else {
                    String reply = "Aapka phone number FoodIQ par registered nahi mila. Kripya apna registered number dobara batayein ya human agent se connect karne ko kahein.";
                    String audio = voiceEngine.synthesize(reply, "hi");
                    result.put("response_text", reply);
                    result.put("audio_url", audio);
                    return result;
                }
            } else if (userSpeech.toLowerCase().contains("agent") || userSpeech.toLowerCase().contains("human") || userSpeech.toLowerCase().contains("transfer")) {
                // Escalate immediately on request even if unauthenticated
                String ticketId = escalationService.escalateCall(session, "Guest customer requested human agent connection.");
                result.put("escalated", true);
                result.put("escalation_ticket", ticketId);
                result.put("response_text", "Connecting you to our support executive. Please hold.");
                return result;
            } else {
                String reply = "Welcome to FoodIQ Support. Please state your registered ten digit mobile number to access your account.";
                String audio = voiceEngine.synthesize(reply, "en");
                result.put("response_text", reply);
                result.put("audio_url", audio);
                return result;
            }
        }

        if (!session.isAuthenticated()) {
            // Waiting for OTP verification
            String digits = extractDigits(userSpeech);
            // Verify if OTP matches
            if (digits != null && (digits.length() == 6 || "123456".equals(digits))) {
                boolean verified = authService.verifyOtp(session, digits);
                if (verified) {
                    String reply = String.format("Aapka verification safal raha. Welcome back, %s! Main aapki kya sahayata kar sakta hoon?", session.getUserName());
                    String audio = voiceEngine.synthesize(reply, "hi");
                    result.put("response_text", reply);
                    result.put("audio_url", audio);
                    return result;
                } else {
                    if (session.getAuthAttempts() >= 3) {
                        // Max attempts - Escalate to human
                        String ticketId = escalationService.escalateCall(session, "Failed OTP verification after 3 attempts.");
                        result.put("escalated", true);
                        result.put("escalation_ticket", ticketId);
                        result.put("response_text", "Authentication failed. Transferring your call to a supervisor.");
                        return result;
                    }
                    String reply = "Entered OTP is incorrect. Please repeat the 6-digit verification code.";
                    String audio = voiceEngine.synthesize(reply, "en");
                    result.put("response_text", reply);
                    result.put("audio_url", audio);
                    return result;
                }
            } else if (userSpeech.toLowerCase().contains("agent") || userSpeech.toLowerCase().contains("human") || userSpeech.toLowerCase().contains("transfer")) {
                String ticketId = escalationService.escalateCall(session, "User requested human agent transfer during OTP flow.");
                result.put("escalated", true);
                result.put("escalation_ticket", ticketId);
                result.put("response_text", "Connecting you to an agent.");
                return result;
            } else {
                String reply = "Please provide the 6 digit verification code sent to your registered email to continue.";
                String audio = voiceEngine.synthesize(reply, "en");
                result.put("response_text", reply);
                result.put("audio_url", audio);
                return result;
            }
        }

        // 2. CONVERSATIONAL AGENT FLOW (Authenticated)
        session.addMessage("user", userSpeech);

        // Run the agent loop (allows LLM to trigger tools, then compile the final reply)
        String llmOutput = callAgentLlm(session);
        String finalReply = llmOutput;
        
        Matcher matcher = TOOL_PATTERN.matcher(llmOutput);
        if (matcher.find()) {
            String toolName = matcher.group(1);
            String arg = matcher.group(2).trim();
            log.info("AI requested tool execution: name={}, arg={}", toolName, arg);

            String toolResult = "";
            boolean doEscalate = false;

            if ("check_order_status".equalsIgnoreCase(toolName)) {
                toolResult = toolsExecutor.checkOrderStatus(session, parseId(arg));
            } else if ("track_delivery_partner".equalsIgnoreCase(toolName)) {
                toolResult = toolsExecutor.trackDeliveryPartner(session, parseId(arg));
            } else if ("cancel_active_order".equalsIgnoreCase(toolName)) {
                toolResult = toolsExecutor.cancelActiveOrder(session, parseId(arg));
            } else if ("initiate_payment_refund".equalsIgnoreCase(toolName)) {
                toolResult = toolsExecutor.initiatePaymentRefund(session, parseId(arg));
                if (toolResult.contains("exceeds") || toolResult.contains("Escalating")) {
                    doEscalate = true;
                }
            } else if ("create_support_ticket".equalsIgnoreCase(toolName)) {
                toolResult = "Support ticket generated: " + toolsExecutor.createSupportTicket(session, arg);
            } else if ("transfer_to_agent".equalsIgnoreCase(toolName)) {
                doEscalate = true;
                toolResult = "Transferring user call...";
            }

            if (doEscalate) {
                String ticketId = escalationService.escalateCall(session, "Escalation requested by agent: " + arg);
                result.put("escalated", true);
                result.put("escalation_ticket", ticketId);
                result.put("response_text", "Sure, transferring your call to a customer support executive.");
                return result;
            }

            // Append tool output to chat history and call LLM again to formulate natural response
            log.info("Tool output: \"{}\". Recalling LLM with results...", toolResult);
            session.addMessage("system", "Tool result: " + toolResult);
            finalReply = callAgentLlm(session);
        }

        // Clean up any tool call tags in the final spoken response
        finalReply = finalReply.replaceAll("\\[TOOL_CALL:[^\\]]+\\]", "").trim();

        // 3. GENERATE AUDIO OUTPUT
        // Select TTS voice language based on text content (Hinglish/Hindi -> hi, English -> en)
        String lang = isHindiOrHinglish(finalReply) ? "hi" : "en";
        String audioUrl = voiceEngine.synthesize(finalReply, lang);

        session.addMessage("assistant", finalReply);
        
        result.put("response_text", finalReply);
        result.put("audio_url", audioUrl);
        return result;
    }

    private String callAgentLlm(CallSession session) {
        List<Map<String, String>> payloadMessages = new ArrayList<>();
        
        // System Prompt with persona and rules
        String systemPrompt = String.format(
            "You are 'FoodIQ AI Voice Support', a helpful customer assistant. You are currently speaking on call with customer %s (ID: %s).\n" +
            "Your Exophone number is 08047280783.\n" +
            "Keep your responses extremely short (max 2 sentences) and suitable for a voice call. Avoid lists, markdown, asterisks, or formatting.\n" +
            "You speak in Hinglish (code-switching English and Hindi) to keep it friendly and clear for Indian users.\n" +
            "If the user asks about an order status, cancel, track, or refund, check if you have the order ID. If not, ask them for the Order ID first.\n" +
            "To call a tool, you MUST write the exact tag: [TOOL_CALL: tool_name, argument] on a new line, and stop generating.\n" +
            "Available tools:\n" +
            "- [TOOL_CALL: check_order_status, orderId]\n" +
            "- [TOOL_CALL: track_delivery_partner, orderId]\n" +
            "- [TOOL_CALL: cancel_active_order, orderId]\n" +
            "- [TOOL_CALL: initiate_payment_refund, orderId]\n" +
            "- [TOOL_CALL: create_support_ticket, issue_description]\n" +
            "- [TOOL_CALL: transfer_to_agent, reason]\n" +
            "IMPORTANT SAFETY RULES:\n" +
            "1. NEVER ask for CVV, password, PIN, or full card numbers. If the user mentions them, ignore them or redact them.\n" +
            "2. If the user is extremely angry, wants to talk to a supervisor, or the issue is unresolved, call transfer_to_agent tool.",
            session.getUserName(), session.getUserId()
        );

        payloadMessages.add(Map.of("role", "system", "content", systemPrompt));
        payloadMessages.addAll(session.getChatHistory());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + config.getGroqApiKey().trim());

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama-3.3-70b-versatile");
            body.put("messages", payloadMessages);
            body.put("temperature", 0.3); // Keep it highly deterministic

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(config.getGroqApiUrl(), entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("LLM execution error: {}", e.getMessage());
        }

        return "Main aapki call support executive ko transfer kar raha hoon. [TOOL_CALL: transfer_to_agent, Connection Error]";
    }

    private Long parseId(String text) {
        try {
            return Long.parseLong(text.replaceAll("\\D", ""));
        } catch (Exception e) {
            return 0L;
        }
    }

    private String extractDigits(String text) {
        if (text == null) return null;
        String digits = text.replaceAll("\\D", "");
        if (digits.isEmpty()) return null;
        return digits;
    }

    private boolean isHindiOrHinglish(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        // Look for common Hindi/Hinglish structural words
        return lower.contains("aap") || lower.contains("kya") || lower.contains("hai") ||
               lower.contains("bheja") || lower.contains("safal") || lower.contains("kripya") ||
               lower.contains("ho") || lower.contains("kar") || lower.contains("se") ||
               lower.contains("hai") || lower.contains("raha") || lower.contains("refund");
    }
}
