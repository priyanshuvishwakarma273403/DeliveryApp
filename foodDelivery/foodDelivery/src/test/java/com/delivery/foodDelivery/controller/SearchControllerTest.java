package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.SearchResultItem;
import com.delivery.foodDelivery.dto.response.SearchSuggestion;
import com.delivery.foodDelivery.entity.SearchHistoryItem;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.UniversalSearchService;
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
import java.util.Collections;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UniversalSearchService searchService;

    @MockBean
    private UserRepository userRepository;

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
    public void testUniversalSearchPublicAccess() throws Exception {
        SearchResultItem mockResult = SearchResultItem.builder()
                .id("res_1")
                .type("RESTAURANT")
                .title("Taco Bell")
                .subtitle("Mexican Food")
                .score(0.9)
                .build();

        Mockito.when(searchService.search(
                Mockito.eq("taco"), 
                Mockito.any(), 
                Mockito.any(), 
                Mockito.any(), 
                Mockito.eq("relevance"), 
                Mockito.anyDouble(), 
                Mockito.anyDouble()
        )).thenReturn(Collections.singletonList(mockResult));

        mockMvc.perform(get("/api/search/universal")
                        .param("q", "taco")
                        .param("sortBy", "relevance")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Taco Bell"))
                .andExpect(jsonPath("$.data[0].type").value("RESTAURANT"));
    }

    @Test
    public void testAutocompletePublicAccess() throws Exception {
        SearchSuggestion mockSuggestion = new SearchSuggestion("Pizza Point", "RESTAURANT", "Pizzas & garlic bread");

        Mockito.when(searchService.autocomplete(Mockito.eq("piz")))
                .thenReturn(Collections.singletonList(mockSuggestion));

        mockMvc.perform(get("/api/search/autocomplete")
                        .param("q", "piz")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].text").value("Pizza Point"));
    }

    @Test
    public void testSearchHistoryRequiresAuthentication() throws Exception {
        // Without authentication, access is publicly permitted but handler checks user context and returns Ok with success=false
        mockMvc.perform(get("/api/search/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Authentication required to fetch history"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testSearchHistoryWithCustomerAuthentication() throws Exception {
        SearchHistoryItem mockHistory = SearchHistoryItem.builder()
                .id("hist_1")
                .userId("101")
                .query("veg burger")
                .timestamp(LocalDateTime.now())
                .count(3)
                .build();

        Mockito.when(searchService.getHistory(Mockito.eq("101")))
                .thenReturn(Collections.singletonList(mockHistory));

        mockMvc.perform(get("/api/search/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].query").value("veg burger"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testAnalyticsRestrictedForCustomer() throws Exception {
        // Restricted by PreAuthorize hasRole('ADMIN') -> AccessDeniedException mapped to 403
        mockMvc.perform(get("/api/search/analytics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    public void testAnalyticsAllowedForAdmin() throws Exception {
        Mockito.when(searchService.getAnalytics()).thenReturn(Collections.emptyMap());

        mockMvc.perform(get("/api/search/analytics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
