package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final OrderRepository orderRepository;
    private final ChatMemoryService chatMemoryService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.model}")
    private String groqModel;

    public String getSmartSuggestion(Long userId) {
        List<Order> history = orderRepository.findByCustomerIdOrderByCreatedDateDesc(userId);
        
        String historySummary = history.stream()
                .limit(5)
                .map(o -> o.getStatus().name()) // Simplification, ideally items
                .collect(Collectors.joining(", "));

        String prompt = String.format(
            "User has ordered these types of food recently: [%s]. " +
            "Suggest one specific healthy alternative or a popular pairing in one short sentence starting with 'Based on your recent orders...'",
            historySummary
        );

        return callGroq(prompt);
    }

    public String getChatbotResponse(String userId, String userName, String userMessage) {
        // 1. Get recent message history
        List<com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument> history = chatMemoryService.getRecentHistory(userId, 8);
        
        // 2. Query OpenSearch for relevant semantic context from past chats
        String semanticContext = chatMemoryService.getSemanticContext(userId, userMessage);
        
        // 3. Build messages list for LLM call
        List<Map<String, String>> messages = new java.util.ArrayList<>();
        
        // System instruction with user profile details
        String systemInstruction = String.format(
            "You are FoodIQ AI, a state-of-the-art food delivery and restaurant intelligence assistant for the 'FoodIQ' platform. " +
            "You are currently chatting with %s (UserID: %s). Always refer to them by their name if they introduce themselves or if you already know it. " +
            "Remember their preferences, names, and past queries. Keep responses extremely concise, conversational, friendly, and helpful.",
            userName, userId
        );
        messages.add(Map.of("role", "system", "content", systemInstruction));
        
        // Inject semantic memories retrieved from OpenSearch (RAG style)
        if (semanticContext != null && !semanticContext.isBlank()) {
            messages.add(Map.of("role", "system", "content", 
                "Here are relevant past conversation snippets retrieved from your OpenSearch vector-style memory for context:\n" + semanticContext
            ));
        }
        
        // Append history
        for (com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument msg : history) {
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }
        
        // Append current message
        messages.add(Map.of("role", "user", "content", userMessage));
        
        // 4. Save user message to memory
        chatMemoryService.saveMessage(userId, "user", userMessage);
        
        // 5. Call LLM
        String response = callGroqWithMessages(messages);
        
        // 6. Save bot response to memory
        chatMemoryService.saveMessage(userId, "assistant", response);
        
        return response;
    }

    private String callGroq(String prompt) {
        return callGroqWithMessages(List.of(
            Map.of("role", "system", "content", "You are FoodIQ AI, a state-of-the-art food delivery and restaurant intelligence assistant for the 'FoodIQ' platform. Suggest 3 delicious dishes based on user preference. Keep it very short and conversational."),
            Map.of("role", "user", "content", prompt)
        ));
    }

    private String callGroqWithMessages(List<Map<String, String>> messages) {
        log.info("Attempting to call Groq AI with message payload. API Key present: {}", (groqApiKey != null && !groqApiKey.isBlank()));
        
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "I'm FoodIQ AI. Please set the GROQ_API_KEY in Render to start chatting!";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("model", (groqModel != null && !groqModel.isBlank()) ? groqModel : "llama-3.3-70b-versatile");
            body.put("messages", messages);
            body.put("temperature", 0.7);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            
            log.info("Sending request to Groq API with {} messages...", messages.size());
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(groqApiUrl, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return "AI Error: Received empty response from Groq.";
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Groq API Http Error: {} - Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "AI Connection Error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString();
        } catch (Exception e) {
            log.error("Groq AI General Error: {}", e.getMessage());
            return "AI Technical Glitch: " + e.getMessage();
        }
    }



}
