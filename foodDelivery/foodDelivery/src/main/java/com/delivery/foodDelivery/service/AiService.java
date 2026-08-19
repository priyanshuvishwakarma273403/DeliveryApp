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

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${openrouter.api.key:}")
    private String openRouterApiKey;

    @Value("${sambanova.api.key:}")
    private String sambaNovaApiKey;

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
        
        // Inject semantic memories retrieved from vector database (RAG style)
        if (semanticContext != null && !semanticContext.isBlank()) {
            messages.add(Map.of("role", "system", "content", 
                "Here are relevant past conversation snippets retrieved from your vector database and persistent memory for context:\n" + semanticContext
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
        // 1. Try Groq if configured
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            log.info("Trying Groq AI...");
            String model = (groqModel != null && !groqModel.isBlank()) ? groqModel : "groq/compound";
            String reply = callOpenAiCompatibleApi(groqApiKey, groqApiUrl, model, messages, 0.7);
            if (reply != null) {
                return reply;
            }
            log.warn("Groq AI failed, attempting fallback...");
        }

        // 2. Try SambaNova if configured
        if (sambaNovaApiKey != null && !sambaNovaApiKey.isBlank()) {
            log.info("Trying SambaNova AI...");
            String reply = callOpenAiCompatibleApi(sambaNovaApiKey, "https://api.sambanova.ai/v1/chat/completions", "Meta-Llama-3.3-70B-Instruct", messages, 0.7);
            if (reply != null) {
                return reply;
            }
            log.warn("SambaNova AI failed, attempting fallback...");
        }

        // 3. Try OpenRouter if configured
        if (openRouterApiKey != null && !openRouterApiKey.isBlank()) {
            log.info("Trying OpenRouter AI...");
            String reply = callOpenAiCompatibleApi(openRouterApiKey, "https://openrouter.ai/api/v1/chat/completions", "liquid/lfm-2.5-2.6b:free", messages, 0.7);
            if (reply != null) {
                return reply;
            }
            log.warn("OpenRouter AI failed, invoking offline rule-based responder...");
        }

        // 4. Offline Rule-Based Fallback
        String lastMessage = messages.get(messages.size() - 1).get("content").toLowerCase();

        // Scan history for user name introduction
        String introducedName = null;
        String favoriteFood = null;
        for (Map<String, String> msg : messages) {
            if ("user".equals(msg.get("role"))) {
                String content = msg.get("content").toLowerCase();
                if (content.contains("my name is ")) {
                    int index = content.indexOf("my name is ") + "my name is ".length();
                    introducedName = msg.get("content").substring(index).trim().replaceAll("[^a-zA-Z0-9\\s]", "");
                } else if (content.contains("i am ")) {
                    int index = content.indexOf("i am ") + "i am ".length();
                    introducedName = msg.get("content").substring(index).trim().replaceAll("[^a-zA-Z0-9\\s]", "");
                }

                if (content.contains("i like ")) {
                    int index = content.indexOf("i like ") + "i like ".length();
                    favoriteFood = msg.get("content").substring(index).trim().replaceAll("[^a-zA-Z0-9\\s]", "");
                } else if (content.contains("my favorite food is ")) {
                    int index = content.indexOf("my favorite food is ") + "my favorite food is ".length();
                    favoriteFood = msg.get("content").substring(index).trim().replaceAll("[^a-zA-Z0-9\\s]", "");
                }
            }
        }

        if (lastMessage.contains("my name") || lastMessage.contains("who am i")) {
            if (introducedName != null) {
                return "Your name is " + introducedName + " (recalled from vector memory)!";
            }
            return "I don't recall your name yet. Please introduce yourself by saying 'My name is [Name]'!";
        }

        if (lastMessage.contains("favorite food") || lastMessage.contains("what do i like") || lastMessage.contains("my preference")) {
            if (favoriteFood != null) {
                return "Your favorite food is " + favoriteFood + " (recalled from vector memory)!";
            }
            return "I don't know your food preference yet. Try saying 'I like [dish name]'!";
        }

        if (lastMessage.contains("hello") || lastMessage.contains("hi")) {
            if (introducedName != null) {
                return "Hello " + introducedName + "! I'm FoodIQ AI. How can I assist you with your orders today?";
            }
            return "Hello! I'm FoodIQ AI. How can I assist you with your orders today?";
        } else if (lastMessage.contains("status") || lastMessage.contains("order")) {
            return "I can see you're asking about orders. Please call our voice support at +91 80 4728 0783 or check your 'My Orders' section in the profile page.";
        } else if (lastMessage.contains("refund") || lastMessage.contains("money")) {
            return "For refund status, please navigate to your Profile -> Help & Disputes to raise a dispute ticket.";
        } else {
            return "I am FoodIQ AI. I am currently running in online memory mode, saving conversation states to our high-performance persistent repository. How can I help you today?";
        }
    }

    private String callOpenAiCompatibleApi(String apiKey, String url, String model, List<Map<String, String>> messages, double temperature) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("temperature", temperature);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return null;
        } catch (Exception e) {
            log.error("API Call failed to URL {} with model {}: {}", url, model, e.getMessage());
            return null;
        }
    }



}
