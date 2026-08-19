package com.delivery.foodDelivery.support.exotel.controller;

import com.delivery.foodDelivery.support.config.VoiceSupportConfig;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import com.delivery.foodDelivery.support.conversation.service.CallSessionManager;
import com.delivery.foodDelivery.support.exotel.model.ExoMLResponse;
import com.delivery.foodDelivery.support.orchestration.service.VoiceAiOrchestrator;
import com.delivery.foodDelivery.support.voice.service.VoiceEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai/voice")
@RequiredArgsConstructor
@Slf4j
public class ExotelVoiceController {

    private final CallSessionManager sessionManager;
    private final VoiceAiOrchestrator orchestrator;
    private final VoiceEngine voiceEngine;
    private final VoiceSupportConfig config;

    /**
     * Webhook called by Exotel when a new call is dialed.
     */
    @PostMapping(value = "/incoming", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleIncomingCall(
            @RequestParam("CallSid") String callSid,
            @RequestParam("From") String fromPhone,
            @RequestParam("To") String toExophone) {
        
        log.info("Incoming call webhook received. CallSid: {}, From: {}, To: {}", callSid, fromPhone, toExophone);
        
        // Initialize or fetch session and resolve caller user details
        CallSession session = sessionManager.getOrCreateSession(callSid, fromPhone);
        
        ExoMLResponse response = new ExoMLResponse();
        
        if (session.getUserId() != null) {
            // User matched automatically
            String greetingText = String.format("Welcome back to FoodIQ customer support, %s. How can I help you today? Please speak after the beep.", 
                    session.getUserName());
            String audioUrl = voiceEngine.synthesize(greetingText, "en");
            
            response.play(audioUrl)
                    .record("/api/ai/voice/process", 15, 3, true);
        } else {
            // Unregistered user - prompt for registration phone
            String greetingText = "Welcome to FoodIQ customer support. It seems this number is not registered. Please speak or type your registered 10-digit mobile number after the beep.";
            String audioUrl = voiceEngine.synthesize(greetingText, "en");
            
            response.play(audioUrl)
                    .record("/api/ai/voice/process", 15, 3, true);
        }
        
        sessionManager.saveSession(session);
        return response.build();
    }

    /**
     * Webhook called by Exotel when user recording is completed.
     */
    @PostMapping(value = "/process", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleProcessRecording(
            @RequestParam("CallSid") String callSid,
            @RequestParam(value = "RecordingUrl", required = false) String recordingUrl,
            @RequestParam(value = "Digits", required = false) String digits) {
        
        log.info("Processing call recording callback. CallSid: {}, RecordingUrl: {}, Digits: {}", 
                callSid, recordingUrl, digits);

        CallSession session = sessionManager.getSession(callSid);
        if (session == null) {
            log.warn("Session not found for CallSid: {}. Recreating.", callSid);
            session = sessionManager.getOrCreateSession(callSid, "");
        }

        ExoMLResponse response = new ExoMLResponse();
        
        // Resolve user speech transcription
        String userSpeech = "";
        if (digits != null && !digits.trim().isEmpty()) {
            userSpeech = digits;
            log.info("Captured DTMF digit entry: {}", userSpeech);
        } else if (recordingUrl != null && !recordingUrl.trim().isEmpty()) {
            userSpeech = voiceEngine.transcribe(recordingUrl);
            log.info("Transcribed spoken speech: \"{}\"", userSpeech);
        }

        // Run the Orchestrator for the next action/response
        Map<String, Object> turnResult = orchestrator.processTurn(session, userSpeech);
        
        boolean escalated = (boolean) turnResult.get("escalated");
        String replyText = (String) turnResult.get("response_text");

        if (escalated) {
            // Dial human executive phone number
            log.info("Escalation triggered. Connecting call {} to supervisor number: {}", 
                    callSid, config.getHumanAgentPhone());
            
            String escalationSpeech = "Sure, connecting your call to a supervisor. Please hold.";
            String audio = voiceEngine.synthesize(escalationSpeech, "en");
            
            response.play(audio)
                    .dial(config.getHumanAgentPhone());
            
            // Clean up session since call is transferred
            sessionManager.removeSession(callSid);
        } else {
            String audioUrl = (String) turnResult.get("audio_url");
            
            // Play AI response and prompt for next user input
            response.play(audioUrl)
                    .record("/api/ai/voice/process", 15, 3, true);
            
            sessionManager.saveSession(session);
        }

        return response.build();
    }

    /**
     * Webhook called by Exotel when the call terminates.
     */
    @PostMapping("/status")
    public void handleCallStatus(@RequestParam("CallSid") String callSid, @RequestParam("Status") String status) {
        log.info("Call status callback received. CallSid: {}, Status: {}", callSid, status);
        if ("completed".equalsIgnoreCase(status) || "terminated".equalsIgnoreCase(status) || "failed".equalsIgnoreCase(status)) {
            sessionManager.removeSession(callSid);
        }
    }
}
