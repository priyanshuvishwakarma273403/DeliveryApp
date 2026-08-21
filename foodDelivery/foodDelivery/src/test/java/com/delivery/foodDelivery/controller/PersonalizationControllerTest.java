package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.TasteDnaRecommendationEngine;
import com.delivery.foodDelivery.service.TasteSignalProcessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PersonalizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserTasteProfileRepository tasteProfileRepository;

    @MockBean
    private UserTasteDimensionRepository tasteDimensionRepository;

    @MockBean
    private UserPreferenceOverrideRepository preferenceOverrideRepository;

    @MockBean
    private RestaurantDigitalTwinStateRepository digitalTwinStateRepository;

    @MockBean
    private TasteDnaRecommendationEngine recommendationEngine;

    @MockBean
    private TasteSignalProcessor tasteSignalProcessor;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    private User mockUser;
    private UserTasteProfile mockProfile;

    @BeforeEach
    public void setup() {
        mockUser = User.builder()
                .id(123L)
                .email("alice@foodiq.com")
                .name("Alice Smith")
                .role(Role.CUSTOMER)
                .build();

        mockProfile = UserTasteProfile.builder()
                .userId("user-123")
                .preferredCuisines(List.of("INDIAN", "CHINESE"))
                .preferredCategories(List.of("MAIN_COURSE"))
                .frequentItems(new HashMap<>())
                .frequentRestaurants(new HashMap<>())
                .dietaryPreferences(List.of("VEGETARIAN"))
                .budgetTier("MEDIUM")
                .explorationScore(0.6)
                .version(2L)
                .lastUpdated(LocalDateTime.now())
                .build();

        Mockito.when(userRepository.findByEmail("alice@foodiq.com")).thenReturn(Optional.of(mockUser));
        Mockito.when(tasteProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(mockProfile));
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testGetHomeFeed() throws Exception {
        Mockito.when(digitalTwinStateRepository.findAll()).thenReturn(Collections.emptyList());
        Mockito.when(recommendationEngine.getRecommendations(
                Mockito.eq("user-123"), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()
        )).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/personalization/home")
                        .param("weather", "RAINY")
                        .param("location", "Noida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tasteDnaCard.budgetTier").value("MEDIUM"))
                .andExpect(jsonPath("$.data.contextBanner.weather").value("RAINY"))
                .andExpect(jsonPath("$.data.contextBanner.location").value("Noida"));
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testGetRecommendations() throws Exception {
        Mockito.when(recommendationEngine.getRecommendations(
                Mockito.eq("user-123"), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()
        )).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/personalization/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testLogFeedback() throws Exception {
        PersonalizationController.FeedbackRequest request = new PersonalizationController.FeedbackRequest();
        request.setEventType("USER_VIEWED_DISH");
        request.setItemId("dish-456");
        request.setRestaurantId("rest-789");

        mockMvc.perform(post("/api/v1/personalization/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Taste DNA updated"));

        Mockito.verify(tasteSignalProcessor, Mockito.times(1)).processEvent(Mockito.any());
    }
}
