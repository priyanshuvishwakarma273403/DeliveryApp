package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.TasteDnaCacheService;
import com.delivery.foodDelivery.service.TasteDnaRecommendationEngine;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TasteDnaControllerTest {

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
    private UserTasteHistoryRepository tasteHistoryRepository;

    @MockBean
    private TasteDnaRecommendationEngine recommendationEngine;

    @MockBean
    private TasteDnaCacheService cacheService;

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
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testGetTasteDna() throws Exception {
        Mockito.when(cacheService.getProfile("user-123")).thenReturn(mockProfile);
        Mockito.when(tasteDimensionRepository.findByUserId(123L)).thenReturn(Collections.emptyList());
        Mockito.when(preferenceOverrideRepository.findByUserId(123L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/v1/users/me/taste-dna"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.userId").value("user-123"))
                .andExpect(jsonPath("$.profile.budgetTier").value("MEDIUM"))
                .andExpect(jsonPath("$.profile.preferredCuisines[0]").value("INDIAN"))
                .andExpect(jsonPath("$.profile.dietaryPreferences[0]").value("VEGETARIAN"));
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testGetRecommendations() throws Exception {
        List<TasteDnaRecommendationEngine.RecommendationCandidate> candidates = new ArrayList<>();
        MenuItem mockItem = MenuItem.builder()
                .id("dish-1")
                .name("Paneer Tikka")
                .price(250.0)
                .vegetarian(true)
                .build();

        candidates.add(TasteDnaRecommendationEngine.RecommendationCandidate.builder()
                .id("dish-1")
                .type("DISH")
                .entity(mockItem)
                .score(0.95)
                .reasonCodes(List.of("SPICY_PREFERENCE", "WITHIN_BUDGET"))
                .build());

        Mockito.when(recommendationEngine.getRecommendations(
                Mockito.eq("user-123"), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()
        )).thenReturn(candidates);

        mockMvc.perform(get("/v1/users/me/recommendations")
                        .param("weather", "RAINY")
                        .param("budget", "300"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.context.weather").value("RAINY"))
                .andExpect(jsonPath("$.recommendations[0].id").value("dish-1"))
                .andExpect(jsonPath("$.recommendations[0].type").value("DISH"))
                .andExpect(jsonPath("$.recommendations[0].score").value(0.95))
                .andExpect(jsonPath("$.recommendations[0].reasonCodes[0]").value("SPICY_PREFERENCE"));
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testSavePreferences() throws Exception {
        Mockito.when(tasteProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(mockProfile));

        UserTasteDnaController.PreferenceRequest req = new UserTasteDnaController.PreferenceRequest();
        req.setPreferredCuisines(List.of("ITALIAN"));
        req.setDietaryPreferences(List.of("VEGAN"));
        req.setExcludedIngredients(List.of("MUSHROOM"));
        req.setBudgetLimit(400.0);

        mockMvc.perform(post("/v1/users/me/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Preferences updated successfully"));

        Mockito.verify(preferenceOverrideRepository, Mockito.atLeastOnce()).save(Mockito.any());
        Mockito.verify(cacheService, Mockito.times(1)).evictProfile("user-123");
    }

    @Test
    @WithMockUser(username = "alice@foodiq.com", roles = {"CUSTOMER"})
    public void testDeleteTasteData() throws Exception {
        Mockito.when(tasteProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(mockProfile));

        mockMvc.perform(delete("/v1/users/me/taste-data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Taste DNA profile and history deleted successfully"));

        Mockito.verify(tasteProfileRepository, Mockito.times(1)).delete(Mockito.any());
        Mockito.verify(cacheService, Mockito.times(1)).evictProfile("user-123");
    }
}
