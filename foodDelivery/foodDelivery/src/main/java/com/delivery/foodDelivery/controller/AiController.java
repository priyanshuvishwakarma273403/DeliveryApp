package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.request.AiMessageRequest;
import com.delivery.foodDelivery.dto.response.*;
import com.delivery.foodDelivery.entity.AIConversation;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.exception.ResourceNotFoundException;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.AiService;
import com.delivery.foodDelivery.service.FoodConciergeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final FoodConciergeService foodConciergeService;
    private final UserRepository userRepository;

    // --- Legacy / Existing Endpoints ---

    @GetMapping("/ai/suggest/{userId}")
    public ResponseEntity<ApiResponse<String>> getSuggestion(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getSmartSuggestion(userId)));
    }

    @PostMapping("/ai/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        String message = request.get("message");
        
        String userId = "anonymous-guest";
        String userName = "Guest User";
        
        if (userDetails != null) {
            java.util.Optional<User> userOpt = userRepository.findByEmail(userDetails.getUsername());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                userId = "user-" + user.getId();
                userName = user.getName();
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(aiService.getChatbotResponse(userId, userName, message)));
    }

    // --- AI Food Concierge Endpoints ---

    @PostMapping("/v1/ai/food-concierge/message")
    public ResponseEntity<ApiResponse<AiMessageResponse>> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AiMessageRequest request) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        AiMessageResponse response = foodConciergeService.processUserMessage(user.getId(), user.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/v1/ai/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationSummaryResponse>>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        List<AiConversationSummaryResponse> response = foodConciergeService.getConversations(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/v1/ai/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<AIConversation>> getConversationDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID conversationId) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        AIConversation response = foodConciergeService.getConversation(conversationId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/v1/ai/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<String>> deleteConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID conversationId) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        foodConciergeService.clearConversation(conversationId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    @PostMapping("/v1/ai/conversations/{conversationId}/clear")
    public ResponseEntity<ApiResponse<String>> clearConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID conversationId) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        foodConciergeService.clearConversation(conversationId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation cleared successfully", null));
    }

    @PostMapping("/v1/ai/cart/confirm")
    public ResponseEntity<ApiResponse<CartResponse>> confirmCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam UUID conversationId) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getUsername()));
        
        CartResponse response = foodConciergeService.confirmDraftCart(user.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Cart confirmed and draft items applied successfully", response));
    }
}
