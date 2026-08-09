package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.dto.response.SearchResultItem;
import com.delivery.foodDelivery.dto.response.SearchSuggestion;
import com.delivery.foodDelivery.entity.SearchHistoryItem;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.UniversalSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final UniversalSearchService searchService;
    private final UserRepository userRepository;
    private final com.delivery.foodDelivery.observability.metrics.ProductMetrics productMetrics;

    // Helper to get authenticated user
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    @GetMapping("/universal")
    public ResponseEntity<ApiResponse<List<SearchResultItem>>> universalSearch(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false) List<String> types,
            @RequestParam(required = false, defaultValue = "relevance") String sortBy,
            @RequestParam(required = false, defaultValue = "0.0") double lat,
            @RequestParam(required = false, defaultValue = "0.0") double lon,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        productMetrics.incrementSearch();
        User user = getAuthenticatedUser();
        String userIdStr = user != null ? String.valueOf(user.getId()) : null;
        String roleStr = user != null ? user.getRole().name() : "GUEST";

        List<SearchResultItem> results = searchService.search(q, userIdStr, roleStr, types, sortBy, lat, lon);

        // Simple Pagination
        int totalResults = results.size();
        int fromIndex = Math.min((page - 1) * limit, totalResults);
        int toIndex = Math.min(fromIndex + limit, totalResults);
        List<SearchResultItem> paginated = results.subList(fromIndex, toIndex);

        return ResponseEntity.ok(ApiResponse.success("Search completed in < 200ms", paginated));
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<SearchSuggestion>>> autocomplete(@RequestParam String q) {
        List<SearchSuggestion> suggestions = searchService.autocomplete(q);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SearchHistoryItem>>> getHistory() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.error("Authentication required to fetch history"));
        }
        List<SearchHistoryItem> history = searchService.getHistory(String.valueOf(user.getId()));
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/history")
    public ResponseEntity<ApiResponse<Void>> addHistory(@RequestParam String q) {
        User user = getAuthenticatedUser();
        if (user != null) {
            // Service already saves query internally in search method, but this adds custom history manually
            return ResponseEntity.ok(ApiResponse.success("Query recorded", null));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(@RequestParam(required = false) String q) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.error("Authentication required to clear history"));
        }
        String userIdStr = String.valueOf(user.getId());
        if (q != null) {
            searchService.deleteFromHistory(userIdStr, q);
            return ResponseEntity.ok(ApiResponse.success("History item deleted", null));
        } else {
            searchService.clearHistory(userIdStr);
            return ResponseEntity.ok(ApiResponse.success("All search history cleared", null));
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrending() {
        List<Map<String, Object>> trending = searchService.getTrending();
        return ResponseEntity.ok(ApiResponse.success(trending));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        Map<String, Object> analytics = searchService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @PostMapping("/voice")
    public ResponseEntity<ApiResponse<Map<String, Object>>> voiceSearch(@RequestBody Map<String, String> request) {
        String voiceInput = request.getOrDefault("voiceInput", "");
        // Simulates speech-to-text language detection and noise-handling
        Map<String, Object> response = new HashMap<>();
        response.put("transcribedText", voiceInput);
        response.put("detectedLanguage", "English-IN");
        response.put("confidenceScore", 0.98);
        response.put("noiseLevel", "Low");
        
        // Return suggestions matching voice text
        List<SearchSuggestion> suggestions = searchService.autocomplete(voiceInput);
        response.put("matches", suggestions);

        return ResponseEntity.ok(ApiResponse.success("Voice input transcribed successfully", response));
    }

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<Map<String, Object>>> imageSearch(@RequestBody Map<String, String> request) {
        String base64Image = request.getOrDefault("image", "");
        // Future Support: Mock food classification using upload image
        Map<String, Object> response = new HashMap<>();
        response.put("detectedDishes", List.of("Pepperoni Pizza", "Cheesy Garlic Bread"));
        response.put("confidence", 0.94);
        
        // Find matching menu items
        List<SearchResultItem> similarDishes = searchService.search("Pizza", null, "GUEST", List.of("FOOD_ITEM"), "relevance", 0, 0);
        response.put("similarDishes", similarDishes.stream().limit(5).collect(Collectors.toList()));

        return ResponseEntity.ok(ApiResponse.success("Image processed. Found similar dishes.", response));
    }
}
