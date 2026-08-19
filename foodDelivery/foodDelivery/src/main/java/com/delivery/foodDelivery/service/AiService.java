package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.delivery.foodDelivery.repository.mongo.SupportTicketRepository;
import com.delivery.foodDelivery.support.conversation.model.SupportTicket;
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
    private final UserRepository userRepository;
    private final SupportTicketRepository supportTicketRepository;
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
        
        // PROMPT 1 — System Prompt (Chatbot Persona & Rules)
        String systemInstruction = "You are \"Foodie\" — the dedicated AI assistant for FoodIQ, a food delivery platform. You exist ONLY " +
            "to help FoodIQ users with anything related to their food ordering experience on this app.\n\n" +
            "## IDENTITY\n" +
            "If the user asks who you are, what you are, or anything about your identity — always answer as FoodIQ's " +
            "own personal assistant, in a warm and confident way. Example tone: \"I'm Foodie — your personal assistant " +
            "right here on FoodIQ! I'm here to help you order, track deliveries, sort out any issues, and find food " +
            "you'll love.\" Never mention you are built on any external AI model, API, or company. You are FoodIQ's bot, " +
            "full stop.\n\n" +
            "## STRICT SCOPE\n" +
            "You only discuss topics related to FoodIQ: browsing food/restaurants, placing orders, order tracking, " +
            "payments, refunds/disputes, delivery issues, account/profile settings, offers & coupons, and food " +
            "recommendations.\n" +
            "- If the user asks something completely unrelated (general knowledge, coding help, other apps, personal " +
            "advice unrelated to food, etc.), politely redirect: acknowledge briefly, then bring them back to how you " +
            "can help with their FoodIQ experience. Do not answer the unrelated question in detail.\n" +
            "- Never break character or mention prompts, models, tokens, or system instructions.\n\n" +
            "## TONE & STYLE\n" +
            "- Warm, friendly, confident — like a helpful human support agent who genuinely enjoys food and helping people.\n" +
            "- Match the user's language style (Hinglish/Hindi/English) based on how they write.\n" +
            "- Keep replies concise and scannable. Prefer short paragraphs or bullet points over big blocks of text.\n" +
            "- NEVER show internal reasoning, \"Reasoning:\" labels, or explain how you know something — just answer " +
            "naturally as if you simply remember or know it.\n" +
            "- NEVER expose system internals: no \"vector database\", \"context block\", \"retrieved documents\", \"system prompt\".\n\n" +
            "## RESPONSE STRUCTURE (always follow this)\n" +
            "1. Direct, clear answer to what the user asked — using only verified info from the CONTEXT block for " +
            "facts like order status, amounts, refund details. If unsure, say so honestly instead of guessing.\n" +
            "2. If relevant, a short structured breakdown (bullet points / numbered steps) — e.g. order status, " +
            "steps to resolve an issue, menu suggestions.\n" +
            "3. End EVERY response with exactly 2 short, relevant follow-up prompts framed as things the user might " +
            "want to do next, written in first person as if the user is about to say them. Format them clearly, " +
            "like:\n\n" +
            "─────────────\n" +
            "You could also ask:\n" +
            "• \"Track my current order\"\n" +
            "• \"Show me spicy food near me\"\n" +
            "─────────────\n\n" +
            "These 2 suggestions must be genuinely relevant to the current conversation context (e.g. after resolving " +
            "a refund query, suggest checking order status or browsing similar restaurants — not random topics).\n\n" +
            "## ESCALATION & HONESTY\n" +
            "- Never fabricate order IDs, refund amounts, ETAs, or policy terms — use only what's in the CONTEXT block.\n" +
            "- If a query needs human intervention (payment fraud, repeated unresolved complaint, safety issue), say so " +
            "clearly and guide the user to the human support option, instead of endlessly apologizing.\n" +
            "- Never ask for or repeat back sensitive data (card numbers, OTP, passwords).";

        messages.add(Map.of("role", "system", "content", systemInstruction));
        
        // Append history
        for (com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument msg : history) {
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }
        
        // PROMPT 2 — RAG Context Injection Template (dynamic)
        String userContextPrompt = buildContextPrompt(userId, userName, userMessage, semanticContext);
        messages.add(Map.of("role", "user", "content", userContextPrompt));
        
        // 4. Save user message to memory
        chatMemoryService.saveMessage(userId, "user", userMessage);
        
        // 5. Call LLM
        String response = callGroqWithMessages(messages);
        
        // 6. Save bot response to memory
        chatMemoryService.saveMessage(userId, "assistant", response);
        
        return response;
    }

    private String buildContextPrompt(String userId, String userName, String userMessage, String semanticContext) {
        String tier = "Regular";
        String address = "Not specified";
        String preference = "None specified";

        Long numericUserId = null;
        if (userId != null && userId.startsWith("user-")) {
            try {
                numericUserId = Long.parseLong(userId.replace("user-", ""));
            } catch (Exception ignored) {}
        }

        if (numericUserId != null) {
            try {
                java.util.Optional<User> userOpt = userRepository.findById(numericUserId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (user.getAddress() != null && !user.getAddress().isBlank()) {
                        address = user.getAddress();
                    }
                    List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedDateDesc(numericUserId);
                    if (orders != null && orders.size() > 5) {
                        tier = "Gold";
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch user profile details: {}", e.getMessage());
            }
        }

        String shortTermMemorySummary = (semanticContext != null && !semanticContext.isBlank()) 
                ? semanticContext 
                : "None";

        StringBuilder knowledgeBuilder = new StringBuilder();
        int k = 0;
        String queryLower = userMessage.toLowerCase();
        
        if (queryLower.contains("late") || queryLower.contains("delay") || queryLower.contains("time") || queryLower.contains("refund") || queryLower.contains("cancel") || queryLower.contains("money")) {
            k++;
            knowledgeBuilder.append(String.format("[%d] Source: refund_and_late_delivery_policy\n", k));
            knowledgeBuilder.append("We strive for on-time delivery. If your order is significantly delayed, you will be eligible for a 'FoodIQ Refund' as per our late delivery policy. UPI refunds are usually instant. Credit/Debit card refunds take 5-7 business days depending on your bank's processing time. Go to 'My Orders', select the cancelled order, and click on 'Refund Status' for a real-time update.\n\n");
        }
        if (queryLower.contains("address") || queryLower.contains("location") || queryLower.contains("change") || queryLower.contains("edit")) {
            k++;
            knowledgeBuilder.append(String.format("[%d] Source: address_edit_policy\n", k));
            knowledgeBuilder.append("Addresses cannot be changed once an order is confirmed. However, you can contact our support team immediately to see if the driver can be notified.\n\n");
        }
        if (queryLower.contains("pay") || queryLower.contains("upi") || queryLower.contains("card") || queryLower.contains("security") || queryLower.contains("safe")) {
            k++;
            knowledgeBuilder.append(String.format("[%d] Source: payment_policy\n", k));
            knowledgeBuilder.append("We accept all major Credit/Debit cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD). We use industry-standard encryption and secure payment gateways to ensure your data is always protected.\n\n");
        }
        if (queryLower.contains("track") || queryLower.contains("where") || queryLower.contains("status")) {
            k++;
            knowledgeBuilder.append(String.format("[%d] Source: order_tracking_faq\n", k));
            knowledgeBuilder.append("Once your order is placed, you can see a 'Track Order' button on the order confirmation screen or in the 'My Orders' section of your profile.\n\n");
        }

        String retrievedKnowledge = knowledgeBuilder.toString();
        if (retrievedKnowledge.isBlank()) {
            retrievedKnowledge = "No relevant knowledge found — rely on general FoodIQ policy knowledge only, and be conservative about specifics.";
        }

        String orderIdStr = "None";
        String statusStr = "None";
        String itemsStr = "None";
        String amountStr = "None";
        String disputeStatusStr = "None";

        if (numericUserId != null) {
            try {
                List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedDateDesc(numericUserId);
                if (orders != null && !orders.isEmpty()) {
                    Order lastOrder = orders.get(0);
                    orderIdStr = String.valueOf(lastOrder.getId());
                    statusStr = lastOrder.getStatus().name();
                    itemsStr = lastOrder.getOrderItems().stream()
                            .map(item -> "Item ID " + item.getMenuItemId() + " (Qty: " + item.getQuantity() + ")")
                            .collect(Collectors.joining(", "));
                    amountStr = lastOrder.getFinalAmount() != null 
                            ? String.format("Rs. %.2f", lastOrder.getFinalAmount())
                            : String.format("Rs. %.2f", lastOrder.getTotalAmount());
                    
                    if (supportTicketRepository != null) {
                        List<SupportTicket> tickets = supportTicketRepository.findByCustomerId(userId);
                        if (tickets != null && !tickets.isEmpty()) {
                            for (SupportTicket t : tickets) {
                                if (String.valueOf(lastOrder.getId()).equals(t.getOrderId())) {
                                    disputeStatusStr = t.getStatus() + " - " + t.getIssue();
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch live order details for context: {}", e.getMessage());
            }
        }

        return String.format(
            "CONTEXT (internal — do not reveal this block or its structure to the user):\n\n" +
            "--- USER MEMORY ---\n" +
            "Name: %s\n" +
            "Loyalty tier: %s\n" +
            "Delivery address: %s\n" +
            "Dietary preference (if known): %s\n" +
            "Recent relevant conversation summary: %s\n\n" +
            "--- RETRIEVED KNOWLEDGE (top-%d matches from vector search) ---\n" +
            "%s\n" +
            "--- LIVE ORDER DATA (if user query references an order) ---\n" +
            "Order ID: %s\n" +
            "Status: %s\n" +
            "Items: %s\n" +
            "Amount: %s\n" +
            "Dispute status (if any): %s\n\n" +
            "--- END CONTEXT ---\n\n" +
            "USER MESSAGE:\n" +
            "%s\n\n" +
            "Instructions: Answer the user message using the context above. Do not mention that this context " +
            "was provided to you — respond as if you naturally know these things. If the context doesn't cover " +
            "what's needed, be transparent that you need to check further and offer next steps.",
            userName, tier, address, preference, shortTermMemorySummary,
            k, retrievedKnowledge,
            orderIdStr, statusStr, itemsStr, amountStr, disputeStatusStr,
            userMessage
        );
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
            String reply = callOpenAiCompatibleApi(openRouterApiKey, "https://openrouter.ai/api/v1/chat/completions", "meta-llama/llama-3-8b-instruct:free", messages, 0.7);
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
