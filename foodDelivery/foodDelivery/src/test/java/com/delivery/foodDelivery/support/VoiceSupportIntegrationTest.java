package com.delivery.foodDelivery.support;

import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.support.conversation.model.CallSession;
import com.delivery.foodDelivery.support.conversation.service.CallSessionManager;
import com.delivery.foodDelivery.support.conversation.service.PhoneAuthenticationService;
import com.delivery.foodDelivery.support.orchestration.service.VoiceAiOrchestrator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class VoiceSupportIntegrationTest {

    @Autowired
    private CallSessionManager sessionManager;

    @Autowired
    private PhoneAuthenticationService authService;

    @Autowired
    private VoiceAiOrchestrator orchestrator;

    @MockBean
    private UserRepository userRepository;

    private User mockUser;

    @BeforeEach
    public void setup() {
        mockUser = User.builder()
                .id(1L)
                .name("Amit Kumar")
                .email("amit.kumar@example.com")
                .phone("9988776655")
                .role(Role.CUSTOMER)
                .active(true)
                .build();
    }

    @Test
    public void testSessionCreationAndUserLookup() {
        // Mock DB lookup
        when(userRepository.findByPhone("9988776655")).thenReturn(Optional.of(mockUser));

        // Get or create session
        CallSession session = sessionManager.getOrCreateSession("call_sid_123", "+919988776655");

        assertNotNull(session);
        assertEquals("call_sid_123", session.getCallSid());
        assertEquals(1L, session.getUserId());
        assertEquals("Amit Kumar", session.getUserName());
        assertTrue(session.isAuthenticated());

        sessionManager.removeSession("call_sid_123");
    }

    @Test
    public void testAuthenticationRequiredForUnregisteredUser() {
        // Caller phone not in repository
        when(userRepository.findByPhone("8888888888")).thenReturn(Optional.empty());

        CallSession session = sessionManager.getOrCreateSession("call_sid_456", "+918888888888");

        assertNotNull(session);
        assertNull(session.getUserId());
        assertFalse(session.isAuthenticated());

        // Process turn with no authentication (should ask for mobile number)
        Map<String, Object> turnResult = orchestrator.processTurn(session, "Hello");
        String responseText = (String) turnResult.get("response_text");
        
        assertTrue(responseText.contains("mobile number") || responseText.contains("register"));
        
        sessionManager.removeSession("call_sid_456");
    }

    @Test
    public void testOtpFlowInterception() {
        // Mock lookup for registered target number
        when(userRepository.findByPhone("9988776655")).thenReturn(Optional.of(mockUser));

        CallSession session = CallSession.builder()
                .callSid("call_sid_789")
                .fromPhone("+918888888888") // Called from unregistered phone
                .authenticated(false)
                .build();

        // 1. Submit registered phone number
        Map<String, Object> step1 = orchestrator.processTurn(session, "My registered number is 9988776655");
        String reply1 = (String) step1.get("response_text");
        
        assertTrue(reply1.contains("OTP") || reply1.contains("verification"));
        assertNotNull(session.getUserId());
        assertNotNull(session.getAuthOtpCode());

        // 2. Submit incorrect OTP code
        Map<String, Object> step2 = orchestrator.processTurn(session, "My code is 000000");
        String reply2 = (String) step2.get("response_text");
        assertTrue(reply2.contains("incorrect") || reply2.contains("galat") || reply2.contains("continue"));

        // 3. Submit correct OTP code (Master OTP 123456)
        Map<String, Object> step3 = orchestrator.processTurn(session, "123456");
        String reply3 = (String) step3.get("response_text");
        assertTrue(reply3.contains("safal") || reply3.contains("welcome") || reply3.contains("success"));
        assertTrue(session.isAuthenticated());
        assertEquals("Amit Kumar", session.getUserName());
    }

    @Test
    public void testEscalationRequest() {
        CallSession session = CallSession.builder()
                .callSid("call_sid_999")
                .fromPhone("+919988776655")
                .userId(1L)
                .userName("Amit Kumar")
                .authenticated(true)
                .build();

        // Process request to speak to an agent
        Map<String, Object> turnResult = orchestrator.processTurn(session, "Connect me to a human support agent please");
        
        assertTrue((Boolean) turnResult.get("escalated"));
        assertNotNull(turnResult.get("escalation_ticket"));
    }
}
