package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.request.AiMessageRequest;
import com.delivery.foodDelivery.dto.request.CartItemRequest;
import com.delivery.foodDelivery.dto.response.*;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.dto.response.AiToolDtos.*;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import com.delivery.foodDelivery.repository.mongo.UserTasteProfileRepository;
import com.delivery.foodDelivery.observability.metrics.AiMetrics;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FoodConciergeService {

    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final AIConversationContextRepository contextRepository;
    private final AIRecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserTasteProfileRepository tasteProfileRepository;

    private final FoodConciergeToolService toolService;
    private final FoodConciergeRankingEngine rankingEngine;
    private final CartService cartService;
    private final KafkaService kafkaService;
    private final RateLimitService rateLimitService;
    private final AiMetrics aiMetrics;
    private final SimpMessagingTemplate messagingTemplate;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
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

    /**
     * Process message from customer, run intent model, execute tools, rank, and reply.
     */
    @Transactional
    public AiMessageResponse processUserMessage(Long userId, String userName, AiMessageRequest request) {
        long startTime = System.currentTimeMillis();
        aiMetrics.incrementAiRequests();

        // 1. Rate Limiting check
        Bucket bucket = rateLimitService.resolveAiBucket(String.valueOf(userId));
        if (!bucket.tryConsume(1)) {
            aiMetrics.incrementAiRequestsFailed();
            throw new RuntimeException("Rate limit exceeded. You can make up to 30 concierge requests per minute.");
        }

        // 2. Input Sanitization & Prompt Injection Protection
        String rawMessage = request.getMessage();
        String sanitizedMessage = sanitizeMessage(rawMessage);
        if (detectPromptInjection(sanitizedMessage)) {
            aiMetrics.incrementAiRequestsFailed();
            throw new IllegalArgumentException("Dangerous input detected. Please rephrase your query without system command phrases.");
        }

        // 3. Retrieve or create Conversation
        AIConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findByIdAndUserId(request.getConversationId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found for this user"));
        } else {
            conversation = AIConversation.builder()
                    .userId(userId)
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // Send WS updates: Started
        sendStatusUpdate(userId, conversation.getId(), "AI_REQUEST_STARTED");
        kafkaService.sendMessage("ai-events", String.format("{\"userId\": %d, \"conversationId\": \"%s\", \"event\": \"REQUEST_STARTED\"}", userId, conversation.getId()));

        // Save user message to database
        AIMessage userMessageEntity = AIMessage.builder()
                .conversation(conversation)
                .role("user")
                .content(sanitizedMessage)
                .build();
        userMessageEntity = messageRepository.save(userMessageEntity);
        conversation.getMessages().add(userMessageEntity);

        sendStatusUpdate(userId, conversation.getId(), "AI_THINKING");

        // 4. Intent Extraction & Slot Filling (LLM or rule-based fallback)
        ExtractedIntentContext intentContext = extractIntentAndContext(sanitizedMessage, conversation.getMessages());
        userMessageEntity.setExtractedIntent(intentContext.getIntent());
        messageRepository.save(userMessageEntity);

        // Update conversation context database entry
        AIConversationContext contextEntity = conversation.getContext();
        if (contextEntity == null) {
            contextEntity = AIConversationContext.builder()
                    .conversation(conversation)
                    .build();
        }
        contextEntity.setIntentName(intentContext.getIntent());
        
        // Save current slots to context JSON
        try {
            contextEntity.setContextDataJson(objectMapper.writeValueAsString(intentContext));
        } catch (Exception e) {
            log.error("Failed to serialize intent context JSON", e);
        }
        contextEntity = contextRepository.save(contextEntity);
        conversation.setContext(contextEntity);

        // Send WS tool updates
        sendStatusUpdate(userId, conversation.getId(), "AI_TOOL_STARTED");

        // 5. Execute Backend Tools & Ranking based on intent
        List<AiRecommendationResponse> rankedRecommendations = new ArrayList<>();
        CartResponse draftCartResponse = null;
        String toolExecutionLogs = "";

        try {
            rankedRecommendations = executeToolsAndGetRankings(userId, intentContext, conversation, userMessageEntity);
            
            // If the intent is CART_BUILD, look at draft cart context
            if ("CART_BUILD".equalsIgnoreCase(intentContext.getIntent())) {
                draftCartResponse = buildDraftCartContext(userId, intentContext, contextEntity);
            }
        } catch (Exception e) {
            log.error("Tool execution or ranking failed", e);
            toolExecutionLogs = "Tool execution failure: " + e.getMessage();
        }

        sendStatusUpdate(userId, conversation.getId(), "AI_TOOL_COMPLETED");

        // 6. Generate final chat response using LLM or rule-based fallback
        String finalResponseContent = generateFinalResponse(userName, sanitizedMessage, conversation.getMessages(), rankedRecommendations, draftCartResponse, toolExecutionLogs);

        // Save assistant message to database
        AIMessage assistantMessageEntity = AIMessage.builder()
                .conversation(conversation)
                .role("assistant")
                .content(finalResponseContent)
                .build();
        assistantMessageEntity = messageRepository.save(assistantMessageEntity);
        conversation.getMessages().add(assistantMessageEntity);

        // 7. Save recommendations generated to repository
        if (!rankedRecommendations.isEmpty()) {
            for (AiRecommendationResponse rec : rankedRecommendations) {
                String entityId = "";
                if (rec.getData() instanceof RestaurantToolDto) {
                    entityId = ((RestaurantToolDto) rec.getData()).getId();
                } else if (rec.getData() instanceof DishToolDto) {
                    entityId = ((DishToolDto) rec.getData()).getId();
                }

                AIRecommendation recommendationEntity = AIRecommendation.builder()
                        .conversation(conversation)
                        .entityType(rec.getEntityType())
                        .entityId(entityId)
                        .score(rec.getScore())
                        .reason(rec.getReason())
                        .build();
                recommendationRepository.save(recommendationEntity);
            }
            aiMetrics.incrementRecommendationsGenerated(rankedRecommendations.size());
        }

        // Record request metrics
        long latency = System.currentTimeMillis() - startTime;
        aiMetrics.recordRequestLatency(latency);

        // Send WS and Kafka completion events
        sendStatusUpdate(userId, conversation.getId(), "AI_REQUEST_COMPLETED");
        
        try {
            Map<String, Object> kafkaEvent = Map.of(
                    "userId", userId,
                    "conversationId", conversation.getId().toString(),
                    "intent", intentContext.getIntent(),
                    "latencyMs", latency,
                    "recommendationsCount", rankedRecommendations.size(),
                    "timestamp", System.currentTimeMillis()
            );
            kafkaService.sendMessage("ai-events", objectMapper.writeValueAsString(kafkaEvent));
        } catch (Exception e) {
            log.error("Failed to serialize AI Kafka event", e);
        }

        return AiMessageResponse.builder()
                .conversationId(conversation.getId())
                .response(finalResponseContent)
                .intent(intentContext.getIntent())
                .recommendations(rankedRecommendations.stream().limit(3).collect(Collectors.toList()))
                .draftCart(draftCartResponse)
                .status("COMPLETED")
                .build();
    }

    /**
     * Executes tools matching the extracted intent and returns ranked recommendations.
     */
    private List<AiRecommendationResponse> executeToolsAndGetRankings(
            Long userId, ExtractedIntentContext intentContext, AIConversation conversation, AIMessage messageEntity) throws Exception {

        UserTasteProfileToolDto profile = toolService.getUserTasteProfileTool(userId);
        List<AiRecommendationResponse> ranked = new ArrayList<>();

        String intent = intentContext.getIntent();
        String city = intentContext.getLocation() != null ? intentContext.getLocation() : "Noida";

        if ("RESTAURANT_SEARCH".equalsIgnoreCase(intent) || "FOOD_DISCOVERY".equalsIgnoreCase(intent)) {
            // Find candidates
            String query = (intentContext.getCuisines() != null && !intentContext.getCuisines().isEmpty()) ?
                    intentContext.getCuisines().get(0) : (intentContext.getDishes() != null && !intentContext.getDishes().isEmpty() ? intentContext.getDishes().get(0) : "");

            long start = System.currentTimeMillis();
            List<RestaurantToolDto> restaurants = toolService.searchRestaurantsTool(query, city);
            logToolCall(messageEntity, "searchRestaurants", Map.of("query", query, "city", city), restaurants, start);

            if (!restaurants.isEmpty()) {
                ranked = rankingEngine.rankRestaurants(restaurants, profile, intentContext);
            }
        } else if ("DISH_SEARCH".equalsIgnoreCase(intent) || "HEALTHY_FOOD".equalsIgnoreCase(intent) || "BUDGET_FOOD".equalsIgnoreCase(intent)) {
            String query = (intentContext.getDishes() != null && !intentContext.getDishes().isEmpty()) ?
                    intentContext.getDishes().get(0) : "";
            String category = (intentContext.getCuisines() != null && !intentContext.getCuisines().isEmpty()) ?
                    intentContext.getCuisines().get(0) : null;
            
            Boolean veg = intentContext.getDietaryPreferences() != null && intentContext.getDietaryPreferences().contains("VEGETARIAN");

            long start = System.currentTimeMillis();
            List<DishToolDto> dishes = toolService.searchDishesTool(query, category, intentContext.getBudgetMax(), veg);
            logToolCall(messageEntity, "searchDishes", Map.of("query", query, "category", category != null ? category : "", "maxPrice", intentContext.getBudgetMax() != null ? intentContext.getBudgetMax() : 0), dishes, start);

            if (!dishes.isEmpty()) {
                ranked = rankingEngine.rankDishes(dishes, profile, intentContext);
            }
        } else if ("FAST_DELIVERY".equalsIgnoreCase(intent)) {
            long start = System.currentTimeMillis();
            List<RestaurantToolDto> restaurants = toolService.getNearbyRestaurantsTool(city);
            logToolCall(messageEntity, "getNearbyRestaurants", Map.of("city", city), restaurants, start);

            if (!restaurants.isEmpty()) {
                ranked = rankingEngine.rankRestaurants(restaurants, profile, intentContext);
            }
        }

        return ranked;
    }

    /**
     * If the intent is CART_BUILD, finds the items and prepares the draft cart metadata.
     * Caches the draft configuration inside the conversation context instead of modifying the active cart immediately.
     */
    private CartResponse buildDraftCartContext(Long userId, ExtractedIntentContext intentContext, AIConversationContext contextEntity) {
        if (intentContext.getDishes() == null || intentContext.getDishes().isEmpty()) {
            return null;
        }

        List<CartItemRequest> items = new ArrayList<>();
        String restaurantId = null;
        String restaurantName = null;

        for (String dishName : intentContext.getDishes()) {
            List<MenuItem> matches = menuItemRepository.findByNameContainingIgnoreCase(dishName);
            if (!matches.isEmpty()) {
                MenuItem item = matches.get(0);
                if (restaurantId == null) {
                    restaurantId = item.getRestaurantId();
                    try {
                        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
                        if (r != null) restaurantName = r.getName();
                    } catch (Exception ignored) {}
                }

                if (item.getRestaurantId().equals(restaurantId) && item.isAvailable()) {
                    CartItemRequest req = new CartItemRequest();
                    req.setMenuItemId(item.getId());
                    req.setQuantity(intentContext.getPeopleCount() != null ? intentContext.getPeopleCount() : 1);
                    items.add(req);
                }
            }
        }

        if (items.isEmpty() || restaurantId == null) {
            return null;
        }

        // Cache the draft cart inside the conversation context contextDataJson field
        try {
            Map<String, Object> ctxData = new HashMap<>();
            ctxData.put("draftRestaurantId", restaurantId);
            ctxData.put("draftItems", items);
            ctxData.put("intentContext", intentContext);

            contextEntity.setContextDataJson(objectMapper.writeValueAsString(ctxData));
            contextRepository.save(contextEntity);
        } catch (Exception e) {
            log.error("Failed to cache draft cart in context JSON", e);
        }

        // Construct a mock preview CartResponse to display to the user/LLM
        List<CartItemResponse> mockItemResponses = new ArrayList<>();
        double totalPrice = 0.0;

        for (CartItemRequest req : items) {
            MenuItem item = menuItemRepository.findById(req.getMenuItemId()).orElse(null);
            if (item != null) {
                double sub = item.getPrice() * req.getQuantity();
                totalPrice += sub;
                mockItemResponses.add(CartItemResponse.builder()
                        .menuItemId(item.getId())
                        .menuItemName(item.getName())
                        .menuItemImage(item.getImageUrl())
                        .unitPrice(item.getPrice())
                        .quantity(req.getQuantity())
                        .subtotal(sub)
                        .build());
            }
        }

        return CartResponse.builder()
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .items(mockItemResponses)
                .totalPrice(totalPrice)
                .totalItems(mockItemResponses.size())
                .userId(userId)
                .build();
    }

    /**
     * Executes the confirmation of a draft cart.
     * Transaction safe: clears the cart, validates items are available, adds items, and clears draft context.
     */
    @Transactional
    public CartResponse confirmDraftCart(Long userId, UUID conversationId) {
        AIConversationContext contextEntity = contextRepository.findByConversationId(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("No active conversation context found for ID: " + conversationId));

        if (contextEntity.getContextDataJson() == null || contextEntity.getContextDataJson().isBlank()) {
            throw new IllegalStateException("No draft cart details found in conversation context.");
        }

        try {
            Map<String, Object> ctxData = objectMapper.readValue(contextEntity.getContextDataJson(), Map.class);
            String restaurantId = (String) ctxData.get("draftRestaurantId");
            List<?> draftItemsRaw = (List<?>) ctxData.get("draftItems");

            if (restaurantId == null || draftItemsRaw == null || draftItemsRaw.isEmpty()) {
                throw new IllegalStateException("Draft cart details are incomplete or empty.");
            }

            List<CartItemRequest> items = new ArrayList<>();
            for (Object obj : draftItemsRaw) {
                Map<?, ?> map = (Map<?, ?>) obj;
                CartItemRequest req = new CartItemRequest();
                req.setMenuItemId((String) map.get("menuItemId"));
                req.setQuantity(map.get("quantity") != null ? Integer.valueOf(map.get("quantity").toString()) : 1);
                items.add(req);
            }

            // Clear the active cart
            cartService.clearCart(userId);

            // Add the validated items to the cart
            CartResponse finalResponse = null;
            for (CartItemRequest req : items) {
                // Ensure availability check passes
                MenuItem item = menuItemRepository.findById(req.getMenuItemId())
                        .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + req.getMenuItemId()));
                if (!item.isAvailable()) {
                    throw new BusinessException("Dish is no longer available: " + item.getName());
                }
                finalResponse = cartService.addItem(userId, req);
            }

            // Clear the cached draft cart config from the context database entry
            ctxData.remove("draftRestaurantId");
            ctxData.remove("draftItems");
            contextEntity.setContextDataJson(objectMapper.writeValueAsString(ctxData));
            contextRepository.save(contextEntity);

            log.info("Successfully confirmed and applied draft cart for userId: {}", userId);
            return finalResponse;

        } catch (Exception e) {
            log.error("Failed to confirm draft cart", e);
            throw new RuntimeException("Cart confirmation failed: " + e.getMessage());
        }
    }

    /**
     * Extracts intent and slots using the LLM. Falls back to a deterministic rule-based parser on failure.
     */
    private ExtractedIntentContext extractIntentAndContext(String message, List<AIMessage> history) {
        String apiKey = getAvailableApiKey();
        if (apiKey == null) {
            aiMetrics.incrementFallbackUsage();
            log.warn("No AI API keys configured. Falling back to rule-based intent parser.");
            return parseFallbackIntent(message);
        }

        List<Map<String, String>> messages = new ArrayList<>();
        String systemPrompt = "You are a precise JSON extractor for a food delivery platform. Your task is to identify the user's intent and extract entities (slots) from their message.\n" +
                "Analyze the conversation history and the latest user message.\n\n" +
                "Return ONLY a JSON object matching this schema. Do not write any markdown blocks, reasoning, or text outside the JSON:\n" +
                "{\n" +
                "  \"intent\": \"FOOD_DISCOVERY\" | \"RESTAURANT_SEARCH\" | \"DISH_SEARCH\" | \"HEALTHY_FOOD\" | \"BUDGET_FOOD\" | \"FAST_DELIVERY\" | \"CART_BUILD\" | \"REORDER\" | \"GENERAL_QUERY\",\n" +
                "  \"cuisines\": [\"cuisineName\", ...],\n" +
                "  \"dishes\": [\"dishName\", ...],\n" +
                "  \"budgetMin\": null | number,\n" +
                "  \"budgetMax\": null | number,\n" +
                "  \"peopleCount\": null | number,\n" +
                "  \"dietaryPreferences\": [\"VEGETARIAN\" | \"VEGAN\", ...],\n" +
                "  \"spiceLevel\": null | \"LOW\" | \"MEDIUM\" | \"HIGH\",\n" +
                "  \"maxDeliveryTimeMinutes\": null | number,\n" +
                "  \"location\": null | string,\n" +
                "  \"mealType\": null | \"BREAKFAST\" | \"LUNCH\" | \"DINNER\" | \"SNACKS\"\n" +
                "}";

        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Inject history context
        history.stream().limit(6).forEach(m -> messages.add(Map.of("role", m.getRole(), "content", m.getContent())));
        messages.add(Map.of("role", "user", "content", message));

        try {
            String url = getApiUrlForProvider();
            String model = getModelForProvider();
            
            String responseJson = callOpenAiCompatibleApiWithJson(apiKey, url, model, messages, 0.1);
            if (responseJson != null && !responseJson.isBlank()) {
                // Strip markdown formatting if any exists
                String sanitizedJson = responseJson.replaceAll("```json", "").replaceAll("```", "").trim();
                return objectMapper.readValue(sanitizedJson, ExtractedIntentContext.class);
            }
        } catch (Exception e) {
            log.error("LLM Intent extraction failed. Invoking fallback parser.", e);
        }

        aiMetrics.incrementFallbackUsage();
        return parseFallbackIntent(message);
    }

    /**
     * Generates the final user-facing response using the LLM with injected context, falling back to rule-based templates.
     */
    private String generateFinalResponse(
            String userName, String userMessage, List<AIMessage> history,
            List<AiRecommendationResponse> recommendations, CartResponse draftCart, String toolErrors) {

        String apiKey = getAvailableApiKey();
        if (apiKey == null) {
            aiMetrics.incrementFallbackUsage();
            return generateFallbackResponse(userMessage, recommendations, draftCart);
        }

        List<Map<String, String>> messages = new ArrayList<>();
        String systemPrompt = "You are \"Foodie\" — the dedicated AI Food Concierge assistant for FoodIQ.\n" +
                "Your role is to help users find delicious food, browse menus, manage their cart, and get recommendations based on real data.\n\n" +
                "## RULES\n" +
                "1. NEVER hallucinate restaurant names, menu items, or prices. ONLY recommend options that are provided to you in the RECOMMENDED ITEMS block.\n" +
                "2. If no items match or are available, explain this honestly and suggest searching for something else.\n" +
                "3. Keep replies concise and easy to read. Use bullet points or short paragraphs.\n" +
                "4. Do NOT include any internal thoughts, reasoning steps, or metadata tags (like \"Reasoning:\", \"Context:\").\n" +
                "5. End your response with EXACTLY two relevant follow-up options in this format:\n" +
                "─────────────\n" +
                "You could also ask:\n" +
                "• \"[First option]\"\n" +
                "• \"[Second option]\"\n" +
                "─────────────\n" +
                "Ensure the suggestions are highly relevant to what was just discussed.";

        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Inject history (up to 8 messages)
        history.stream().limit(8).forEach(m -> messages.add(Map.of("role", m.getRole(), "content", m.getContent())));

        // Build prompt context
        StringBuilder ctx = new StringBuilder("CONTEXT FOR RESPONSE:\n\n");
        ctx.append("User Name: ").append(userName).append("\n");

        if (recommendations != null && !recommendations.isEmpty()) {
            ctx.append("--- RECOMMENDED ITEMS (ground truth - recommend ONLY these) ---\n");
            for (AiRecommendationResponse rec : recommendations) {
                if (rec.getData() instanceof RestaurantToolDto) {
                    RestaurantToolDto r = (RestaurantToolDto) rec.getData();
                    ctx.append(String.format("- Restaurant: %s [ID: %s], Cuisine: %s, Rating: %s, Delivery Time: %d mins, Reason: %s\n",
                            r.getName(), r.getId(), r.getCuisine(), r.getRating(), r.getAvgDeliveryTime(), rec.getReason()));
                } else if (rec.getData() instanceof DishToolDto) {
                    DishToolDto d = (DishToolDto) rec.getData();
                    ctx.append(String.format("- Dish: %s [ID: %s], Price: Rs. %.1f, Vegetarian: %b, Restaurant: %s, Reason: %s\n",
                            d.getName(), d.getId(), d.getPrice(), d.isVegetarian(), d.getRestaurantName(), rec.getReason()));
                }
            }
            ctx.append("\n");
        }

        if (draftCart != null) {
            ctx.append("--- DRAFT CART PREVIEW ---\n");
            ctx.append("Restaurant: ").append(draftCart.getRestaurantName()).append("\n");
            for (CartItemResponse item : draftCart.getItems()) {
                ctx.append(String.format("- Item: %s, Qty: %d, Subtotal: Rs. %.1f\n",
                        item.getMenuItemName(), item.getQuantity(), item.getSubtotal()));
            }
            ctx.append("Total Price: Rs. ").append(draftCart.getTotalPrice()).append("\n");
            ctx.append("Action instruction: Tell the user that they can confirm this draft cart to add it to their actual active cart!\n\n");
        }

        if (toolErrors != null && !toolErrors.isBlank()) {
            ctx.append("--- ERRORS ---\n").append(toolErrors).append("\n\n");
        }

        messages.add(Map.of("role", "user", "content", ctx.toString()));

        try {
            String url = getApiUrlForProvider();
            String model = getModelForProvider();
            
            String reply = callOpenAiCompatibleApi(apiKey, url, model, messages, 0.7);
            if (reply != null && !reply.isBlank()) {
                return reply;
            }
        } catch (Exception e) {
            log.error("LLM Final Response generation failed. Invoking fallback generator.", e);
        }

        aiMetrics.incrementFallbackUsage();
        return generateFallbackResponse(userMessage, recommendations, draftCart);
    }

    private String generateFallbackResponse(String message, List<AiRecommendationResponse> recommendations, CartResponse draftCart) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hi! I'm currently running in offline assistant mode. Based on your request, here is what I found:\n\n");

        if (recommendations != null && !recommendations.isEmpty()) {
            sb.append("Recommendations:\n");
            for (AiRecommendationResponse rec : recommendations.stream().limit(3).collect(Collectors.toList())) {
                if (rec.getData() instanceof RestaurantToolDto) {
                    RestaurantToolDto r = (RestaurantToolDto) rec.getData();
                    sb.append(String.format("• **%s** - %s cuisine (%s ⭐, %d min delivery). *Reason: %s*\n",
                            r.getName(), r.getCuisine(), r.getRating(), r.getAvgDeliveryTime(), rec.getReason()));
                } else if (rec.getData() instanceof DishToolDto) {
                    DishToolDto d = (DishToolDto) rec.getData();
                    sb.append(String.format("• **%s** from %s - Rs. %.0f (%s). *Reason: %s*\n",
                            d.getName(), d.getRestaurantName(), d.getPrice(), d.isVegetarian() ? "Veg" : "Non-Veg", rec.getReason()));
                }
            }
            sb.append("\n");
        } else if (draftCart != null) {
            sb.append(String.format("I've drafted a cart from **%s** containing:\n", draftCart.getRestaurantName()));
            for (CartItemResponse item : draftCart.getItems()) {
                sb.append(String.format("• %s x %d (Rs. %.0f)\n", item.getMenuItemName(), item.getQuantity(), item.getSubtotal()));
            }
            sb.append(String.format("\nTotal Price: **Rs. %.0f**\n", draftCart.getTotalPrice()));
            sb.append("Please click confirm to add these items to your active cart!\n\n");
        } else {
            sb.append("I couldn't find any direct matches. Could you try specifying a different cuisine, dish, or restaurant name?\n\n");
        }

        sb.append("─────────────\n")
                .append("You could also ask:\n")
                .append("• \"Show me nearby top restaurants\"\n")
                .append("• \"Clear conversation memory\"\n")
                .append("─────────────");

        return sb.toString();
    }

    /**
     * CRUD: Get all conversations for a user
     */
    public List<AiConversationSummaryResponse> getConversations(Long userId) {
        List<AIConversation> convs = conversationRepository.findByUserIdOrderByCreatedDateDesc(userId);
        return convs.stream()
                .map(c -> {
                    String lastMessage = "Empty conversation";
                    String lastIntent = "UNKNOWN";
                    if (!c.getMessages().isEmpty()) {
                        AIMessage last = c.getMessages().get(c.getMessages().size() - 1);
                        lastMessage = last.getContent();
                        lastIntent = last.getExtractedIntent();
                    }
                    return AiConversationSummaryResponse.builder()
                            .conversationId(c.getId())
                            .userId(c.getUserId())
                            .lastMessage(lastMessage)
                            .lastIntent(lastIntent)
                            .createdAt(c.getCreatedDate())
                            .updatedAt(c.getUpdatedDate())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * CRUD: Get details of a single conversation
     */
    public AIConversation getConversation(UUID conversationId, Long userId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
    }

    /**
     * CRUD: Clear/delete conversation history
     */
    @Transactional
    public void clearConversation(UUID conversationId, Long userId) {
        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        conversationRepository.delete(conversation);
        log.info("Deleted conversation ID: {} for user ID: {}", conversationId, userId);
    }

    // --- Helper Utility Methods ---
    private String sanitizeMessage(String input) {
        if (input == null) return "";
        return input.replaceAll("<[^>]*>", "").trim();
    }

    private boolean detectPromptInjection(String input) {
        if (input == null) return false;
        String lower = input.toLowerCase();
        return lower.contains("ignore previous instructions") ||
                lower.contains("ignore all rules") ||
                lower.contains("system prompt") ||
                lower.contains("you are now a") ||
                lower.contains("override instructions") ||
                lower.contains("forget previous") ||
                lower.contains("act as a");
    }

    private void sendStatusUpdate(Long userId, UUID conversationId, String status) {
        try {
            Map<String, Object> payload = Map.of(
                    "conversationId", conversationId.toString(),
                    "status", status,
                    "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSend("/topic/ai/concierge/" + userId, payload);
            messagingTemplate.convertAndSend("/topic/ai/conversation/" + conversationId, payload);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket status update: {}", e.getMessage());
        }
    }

    private void logToolCall(AIMessage messageEntity, String toolName, Map<String, Object> args, Object response, long start) {
        try {
            String argsJson = objectMapper.writeValueAsString(args);
            String responseJson = objectMapper.writeValueAsString(response);
            AIToolCall toolCall = AIToolCall.builder()
                    .message(messageEntity)
                    .toolName(toolName)
                    .arguments(argsJson)
                    .response(responseJson)
                    .executionTimeMs(System.currentTimeMillis() - start)
                    .build();
            messageEntity.getToolCalls().add(toolCall);
        } catch (Exception e) {
            log.error("Failed to serialize and log tool call metadata", e);
        }
    }

    private String getAvailableApiKey() {
        if (groqApiKey != null && !groqApiKey.isBlank()) return groqApiKey;
        if (sambaNovaApiKey != null && !sambaNovaApiKey.isBlank()) return sambaNovaApiKey;
        if (openRouterApiKey != null && !openRouterApiKey.isBlank()) return openRouterApiKey;
        return null;
    }

    private String getApiUrlForProvider() {
        if (groqApiKey != null && !groqApiKey.isBlank()) return groqApiUrl;
        if (sambaNovaApiKey != null && !sambaNovaApiKey.isBlank()) return "https://api.sambanova.ai/v1/chat/completions";
        if (openRouterApiKey != null && !openRouterApiKey.isBlank()) return "https://openrouter.ai/api/v1/chat/completions";
        return null;
    }

    private String getModelForProvider() {
        if (groqApiKey != null && !groqApiKey.isBlank()) return groqModel;
        if (sambaNovaApiKey != null && !sambaNovaApiKey.isBlank()) return "Meta-Llama-3.3-70B-Instruct";
        if (openRouterApiKey != null && !openRouterApiKey.isBlank()) return "meta-llama/llama-3-8b-instruct:free";
        return null;
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

    private String callOpenAiCompatibleApiWithJson(String apiKey, String url, String model, List<Map<String, String>> messages, double temperature) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("temperature", temperature);
            body.put("response_format", Map.of("type", "json_object"));

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

    private ExtractedIntentContext parseFallbackIntent(String userMessage) {
        String msg = userMessage.toLowerCase();
        ExtractedIntentContext context = new ExtractedIntentContext();
        context.setIntent("FOOD_DISCOVERY");

        if (msg.contains("cart") || msg.contains("add") || msg.contains("checkout") || msg.contains("order")) {
            context.setIntent("CART_BUILD");
        } else if (msg.contains("reorder") || msg.contains("previous order") || msg.contains("past order")) {
            context.setIntent("REORDER");
        } else if (msg.contains("healthy") || msg.contains("salad") || msg.contains("diet")) {
            context.setIntent("HEALTHY_FOOD");
        } else if (msg.contains("budget") || msg.contains("cheap") || msg.contains("under") || msg.contains("rs")) {
            context.setIntent("BUDGET_FOOD");
        } else if (msg.contains("fast") || msg.contains("quick") || msg.contains("early") || msg.contains("minutes")) {
            context.setIntent("FAST_DELIVERY");
        }

        // Extract cuisines
        List<String> cuisines = new ArrayList<>();
        if (msg.contains("indian")) cuisines.add("Indian");
        if (msg.contains("chinese")) cuisines.add("Chinese");
        if (msg.contains("italian") || msg.contains("pizza")) cuisines.add("Italian");
        if (msg.contains("mexican")) cuisines.add("Mexican");
        context.setCuisines(cuisines);

        // Extract dishes
        List<String> dishes = new ArrayList<>();
        if (msg.contains("biryani")) dishes.add("Biryani");
        if (msg.contains("pizza")) dishes.add("Pizza");
        if (msg.contains("burger")) dishes.add("Burger");
        if (msg.contains("fried rice")) dishes.add("Fried Rice");
        context.setDishes(dishes);

        // Extract budget limit
        if (msg.contains("under 200") || msg.contains("under rs 200")) context.setBudgetMax(200.0);
        else if (msg.contains("under 300") || msg.contains("under rs 300")) context.setBudgetMax(300.0);
        else if (msg.contains("under 400") || msg.contains("under rs 400")) context.setBudgetMax(400.0);
        else if (msg.contains("under 500") || msg.contains("under rs 500")) context.setBudgetMax(500.0);

        if (msg.contains("veg") || msg.contains("vegetarian")) {
            context.setDietaryPreferences(List.of("VEGETARIAN"));
        }

        return context;
    }
}
