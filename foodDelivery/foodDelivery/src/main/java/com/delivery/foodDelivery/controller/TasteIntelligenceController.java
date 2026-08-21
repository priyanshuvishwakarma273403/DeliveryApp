package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.TasteIntelligenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class TasteIntelligenceController {

    private final TasteIntelligenceService tasteIntelligenceService;
    private final UserRepository userRepository;

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<TasteIntelligenceService.TasteRecommendationDto>>> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double budget) {
        
        User user = resolveUser(userDetails);
        Long userId = (user != null) ? user.getId() : null;
        
        List<TasteIntelligenceService.TasteRecommendationDto> list = 
                tasteIntelligenceService.getRecommendations(userId, weather, timeOfDay, location, budget);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/recommendations/home")
    public ResponseEntity<ApiResponse<Map<String, List<TasteIntelligenceService.TasteRecommendationDto>>>> getHomeFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String location) {
        
        User user = resolveUser(userDetails);
        Long userId = (user != null) ? user.getId() : null;
        
        Map<String, List<TasteIntelligenceService.TasteRecommendationDto>> feed = 
                tasteIntelligenceService.getHomeFeed(userId, weather, timeOfDay, location);
        return ResponseEntity.ok(ApiResponse.success(feed));
    }

    @GetMapping("/recommendations/reorder")
    public ResponseEntity<ApiResponse<List<TasteIntelligenceService.TasteRecommendationDto>>> getReorderRecommendations(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = resolveUser(userDetails);
        if (user == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Authentication required for reorders"));
        }
        
        List<TasteIntelligenceService.TasteRecommendationDto> reorders = 
                tasteIntelligenceService.getReorderRecommendations(user.getId());
        return ResponseEntity.ok(ApiResponse.success(reorders));
    }

    @GetMapping("/recommendations/trending")
    public ResponseEntity<ApiResponse<List<TasteIntelligenceService.TasteRecommendationDto>>> getTrendingRecommendations(
            @RequestParam(required = false) String location) {
        
        List<TasteIntelligenceService.TasteRecommendationDto> trending = 
                tasteIntelligenceService.getTrendingRecommendations(location);
        return ResponseEntity.ok(ApiResponse.success(trending));
    }

    @GetMapping("/recommendations/meal")
    public ResponseEntity<ApiResponse<List<TasteIntelligenceService.TasteRecommendationDto>>> getMealBuilderRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Double budget) {
        
        User user = resolveUser(userDetails);
        Long userId = (user != null) ? user.getId() : null;
        
        List<TasteIntelligenceService.TasteRecommendationDto> meals = 
                tasteIntelligenceService.getMealBuilderRecommendations(userId, budget);
        return ResponseEntity.ok(ApiResponse.success(meals));
    }

    @PostMapping("/recommendations/feedback")
    public ResponseEntity<ApiResponse<String>> logFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        
        User user = resolveUser(userDetails);
        if (user == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Authentication required for logging feedback"));
        }
        
        String itemId = payload.get("itemId");
        String itemType = payload.get("itemType");
        String feedback = payload.get("feedback");
        
        tasteIntelligenceService.logFeedback(user.getId(), itemId, itemType, feedback);
        return ResponseEntity.ok(ApiResponse.success("Feedback registered successfully"));
    }

    @GetMapping("/profile/taste")
    public ResponseEntity<ApiResponse<TasteIntelligenceService.TastePreferencesDto>> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = resolveUser(userDetails);
        if (user == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Authentication required"));
        }
        
        TasteIntelligenceService.TastePreferencesDto prefs = tasteIntelligenceService.getPreferences(user.getId());
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    @PutMapping("/profile/taste")
    public ResponseEntity<ApiResponse<String>> savePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TasteIntelligenceService.TastePreferencesDto dto) {
        
        User user = resolveUser(userDetails);
        if (user == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Authentication required"));
        }
        
        tasteIntelligenceService.savePreferences(user.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully"));
    }

    @PostMapping("/discovery/query")
    public ResponseEntity<ApiResponse<Map<String, Object>>> parseQuery(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        
        User user = resolveUser(userDetails);
        Long userId = (user != null) ? user.getId() : null;
        String query = payload.get("query");
        
        Map<String, Object> result = tasteIntelligenceService.parseNaturalLanguageQuery(query, userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/cart/recommendations")
    public ResponseEntity<ApiResponse<List<TasteIntelligenceService.TasteRecommendationDto>>> getCartRecommendations(
            @RequestBody Map<String, List<String>> payload) {
        
        List<String> cartItemIds = payload.get("cartItemIds");
        List<TasteIntelligenceService.TasteRecommendationDto> suggestions = 
                tasteIntelligenceService.getCartRecommendations(cartItemIds);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }
}
