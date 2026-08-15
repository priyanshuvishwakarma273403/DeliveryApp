package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final UserRepository userRepository;

    @GetMapping("/suggest/{userId}")
    public ResponseEntity<ApiResponse<String>> getSuggestion(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getSmartSuggestion(userId)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody java.util.Map<String, String> request) {
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

}

