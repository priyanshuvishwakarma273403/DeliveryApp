package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.request.BroadcastRequest;
import com.delivery.foodDelivery.dto.request.NotificationRequest;
import com.delivery.foodDelivery.entity.NotificationCampaign;
import com.delivery.foodDelivery.entity.NotificationMessage;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.entity.UserNotificationPreference;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.NotificationService;
import com.delivery.foodDelivery.service.KafkaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private KafkaService kafkaService;

    @BeforeEach
    public void setup() {
        // Setup mock CUSTOMER user
        User mockCustomer = User.builder()
                .id(101L)
                .email("customer1")
                .role(Role.CUSTOMER)
                .build();
        Mockito.when(userRepository.findByEmail("customer1")).thenReturn(Optional.of(mockCustomer));

        // Setup mock ADMIN user
        User mockAdmin = User.builder()
                .id(202L)
                .email("admin1")
                .role(Role.ADMIN)
                .build();
        Mockito.when(userRepository.findByEmail("admin1")).thenReturn(Optional.of(mockAdmin));
    }

    @Test
    public void testGetInboxUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/notifications/inbox")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testGetInboxAuthenticated() throws Exception {
        NotificationMessage mockMsg = NotificationMessage.builder()
                .id("notif_1")
                .userId("101")
                .title("Order Confirmed")
                .body("Your burger is cooking.")
                .status("SENT")
                .build();
        
        Page<NotificationMessage> mockPage = new PageImpl<>(Collections.singletonList(mockMsg));

        Mockito.when(notificationService.getInbox(Mockito.eq("101"), Mockito.eq("ALL"), Mockito.anyInt(), Mockito.anyInt()))
                .thenReturn(mockPage);

        mockMvc.perform(get("/api/notifications/inbox")
                        .param("tab", "ALL")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Order Confirmed"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testGetPreferences() throws Exception {
        UserNotificationPreference mockPref = UserNotificationPreference.builder()
                .userId(101L)
                .emailEnabled(true)
                .pushEnabled(true)
                .smsEnabled(false)
                .build();

        Mockito.when(notificationService.getOrCreatePreferences(101L)).thenReturn(mockPref);

        mockMvc.perform(get("/api/notifications/preferences")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.emailEnabled").value(true))
                .andExpect(jsonPath("$.data.smsEnabled").value(false));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testUpdatePreferences() throws Exception {
        UserNotificationPreference newPref = UserNotificationPreference.builder()
                .userId(101L)
                .emailEnabled(false)
                .pushEnabled(true)
                .smsEnabled(true)
                .build();

        Mockito.when(notificationService.savePreferences(Mockito.eq(101L), Mockito.any(UserNotificationPreference.class)))
                .thenReturn(newPref);

        mockMvc.perform(put("/api/notifications/preferences")
                        .content(objectMapper.writeValueAsString(newPref))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.emailEnabled").value(false))
                .andExpect(jsonPath("$.data.smsEnabled").value(true));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testSendSingleNotification() throws Exception {
        NotificationRequest request = NotificationRequest.builder()
                .userId("101")
                .event("ORDER_PLACED")
                .type("TRANSACTIONAL")
                .variables(new HashMap<>())
                .build();

        NotificationMessage mockResult = NotificationMessage.builder()
                .id("notif_2")
                .userId("101")
                .event("ORDER_PLACED")
                .title("Order Placed")
                .build();

        Mockito.when(notificationService.sendNotification(Mockito.any(NotificationRequest.class)))
                .thenReturn(mockResult);

        mockMvc.perform(post("/api/notifications/send")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("notif_2"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testAdminEndpointsForbiddenForCustomer() throws Exception {
        BroadcastRequest broadcastRequest = BroadcastRequest.builder()
                .targetSegment("ALL")
                .title("Emergency announcement")
                .body("Server downtime expected")
                .build();

        mockMvc.perform(post("/api/notifications/broadcast")
                        .content(objectMapper.writeValueAsString(broadcastRequest))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    public void testAdminBroadcastAllowedForAdmin() throws Exception {
        BroadcastRequest broadcastRequest = BroadcastRequest.builder()
                .targetSegment("ALL")
                .title("System Maintenance")
                .body("Maintenance at 3 AM")
                .build();

        mockMvc.perform(post("/api/notifications/broadcast")
                        .content(objectMapper.writeValueAsString(broadcastRequest))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    public void testAdminCampaignAllowedForAdmin() throws Exception {
        NotificationCampaign campaign = NotificationCampaign.builder()
                .name("Flash Sale Campaign")
                .type("FLASH_SALE")
                .title("Midnight Flash Sale!")
                .body("Get 50% off starting midnight")
                .targetSegment("CUSTOMERS")
                .channel("PUSH")
                .build();

        Mockito.when(notificationService.createCampaign(Mockito.any(NotificationCampaign.class)))
                .thenReturn(campaign);

        mockMvc.perform(post("/api/notifications/campaign")
                        .content(objectMapper.writeValueAsString(campaign))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Flash Sale Campaign"));
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    public void testFestivalBlastAllowedForAdmin() throws Exception {
        HashMap<String, String> request = new HashMap<>();
        request.put("festivalName", "Diwali");
        request.put("title", "Happy Diwali!");
        request.put("message", "Wishing you a happy and safe Diwali!");

        mockMvc.perform(post("/api/notifications/festival-blast")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Festival greetings broadcast event triggered successfully."));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testFestivalBlastForbiddenForCustomer() throws Exception {
        HashMap<String, String> request = new HashMap<>();
        request.put("festivalName", "Diwali");
        request.put("title", "Happy Diwali!");
        request.put("message", "Wishing you a happy and safe Diwali!");

        mockMvc.perform(post("/api/notifications/festival-blast")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
