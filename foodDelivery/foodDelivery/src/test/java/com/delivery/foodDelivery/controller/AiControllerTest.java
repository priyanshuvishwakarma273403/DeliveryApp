package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.request.AiMessageRequest;
import com.delivery.foodDelivery.dto.response.AiMessageResponse;
import com.delivery.foodDelivery.dto.response.CartResponse;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.FoodConciergeService;
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

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FoodConciergeService foodConciergeService;

    @MockBean
    private UserRepository userRepository;

    private User mockCustomer;

    @BeforeEach
    public void setup() {
        mockCustomer = User.builder()
                .id(1L)
                .email("testcustomer@foodiq.com")
                .name("Alice")
                .role(Role.CUSTOMER)
                .build();
        Mockito.when(userRepository.findByEmail("testcustomer@foodiq.com")).thenReturn(Optional.of(mockCustomer));
    }

    @Test
    public void testSendMessageUnauthenticated() throws Exception {
        AiMessageRequest req = new AiMessageRequest();
        req.setMessage("Hi Foodie");

        mockMvc.perform(post("/v1/ai/food-concierge/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testcustomer@foodiq.com", roles = {"CUSTOMER"})
    public void testSendMessageAuthenticated() throws Exception {
        AiMessageRequest req = new AiMessageRequest();
        req.setMessage("Suggest some spicy Indian food under Rs 500");

        AiMessageResponse mockRes = AiMessageResponse.builder()
                .conversationId(UUID.randomUUID())
                .response("Here are some spicy Indian dishes for you!")
                .intent("DISH_SEARCH")
                .recommendations(Collections.emptyList())
                .status("COMPLETED")
                .build();

        Mockito.when(foodConciergeService.processUserMessage(
                Mockito.eq(mockCustomer.getId()),
                Mockito.eq(mockCustomer.getName()),
                Mockito.any(AiMessageRequest.class)
        )).thenReturn(mockRes);

        mockMvc.perform(post("/v1/ai/food-concierge/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.response").value("Here are some spicy Indian dishes for you!"))
                .andExpect(jsonPath("$.data.intent").value("DISH_SEARCH"));
    }

    @Test
    @WithMockUser(username = "testcustomer@foodiq.com", roles = {"CUSTOMER"})
    public void testConfirmCart() throws Exception {
        UUID conversationId = UUID.randomUUID();
        CartResponse mockCartResponse = CartResponse.builder()
                .userId(mockCustomer.getId())
                .restaurantName("Tandoori Nights")
                .totalPrice(450.0)
                .totalItems(2)
                .items(Collections.emptyList())
                .build();

        Mockito.when(foodConciergeService.confirmDraftCart(
                Mockito.eq(mockCustomer.getId()),
                Mockito.eq(conversationId)
        )).thenReturn(mockCartResponse);

        mockMvc.perform(post("/v1/ai/cart/confirm")
                        .param("conversationId", conversationId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.restaurantName").value("Tandoori Nights"))
                .andExpect(jsonPath("$.data.totalPrice").value(450.0));
    }
}
