package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.RecommendationCampaign;
import com.delivery.foodDelivery.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<Map<String, List<RecommendationService.RecommendationResult>>>> getHomeFeed(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String weather,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String event,
            @RequestParam(required = false) String location) {
        
        Map<String, List<RecommendationService.RecommendationResult>> feed = 
                recommendationService.getHomeRecommendations(userId, weather, timeOfDay, event, location);
        return ResponseEntity.ok(ApiResponse.success(feed));
    }

    @GetMapping("/combos")
    public ResponseEntity<ApiResponse<List<RecommendationService.SmartCombo>>> getCombos(
            @RequestParam(required = false) List<String> cartItemIds) {
        
        List<RecommendationService.SmartCombo> combos = recommendationService.getFrequentlyBoughtTogether(cartItemIds);
        return ResponseEntity.ok(ApiResponse.success(combos));
    }

    @PostMapping("/track")
    public ResponseEntity<ApiResponse<String>> trackInteraction(
            @RequestParam(required = false) String userId,
            @RequestParam String itemId,
            @RequestParam String action) {
        
        recommendationService.trackUserInteraction(userId, itemId, action);
        return ResponseEntity.ok(ApiResponse.success("Interaction logged successfully"));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        Map<String, Object> report = recommendationService.getRecommendationAnalytics();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RecommendationCampaign>> createCampaign(
            @RequestBody RecommendationCampaign campaign) {
        RecommendationCampaign created = recommendationService.createCampaign(campaign);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PatchMapping("/campaigns/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RecommendationCampaign>> toggleCampaign(
            @PathVariable String id,
            @RequestParam boolean active) {
        RecommendationCampaign updated = recommendationService.toggleCampaign(id, active);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
