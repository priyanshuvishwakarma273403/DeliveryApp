package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.SearchResultItem;
import com.delivery.foodDelivery.dto.response.SearchSuggestion;
import com.delivery.foodDelivery.entity.SearchHistoryItem;
import com.delivery.foodDelivery.service.UniversalSearchService;
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
import java.util.Arrays;
import java.util.Collections;

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
        // Without authentication, accessing secured endpoint should fail (401 or 403 depending on security config)
        mockMvc.perform(get("/api/search/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    public void testSearchHistoryWithCustomerAuthentication() throws Exception {
        SearchHistoryItem mockHistory = SearchHistoryItem.builder()
                .id("hist_1")
                .userId("customer1")
                .query("veg burger")
                .timestamp(LocalDateTime.now())
                .count(3)
                .build();

        Mockito.when(searchService.getUserSearchHistory(Mockito.anyString()))
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
        mockMvc.perform(get("/api/search/analytics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    public void testAnalyticsAllowedForAdmin() throws Exception {
        mockMvc.perform(get("/api/search/analytics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
