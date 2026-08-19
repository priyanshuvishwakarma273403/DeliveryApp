package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.elasticsearch.ChatMemoryDocument;
import com.delivery.foodDelivery.repository.elasticsearch.ChatMemoryRepository;
import com.delivery.foodDelivery.repository.mongo.ChatMemoryMongoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.core.query.StringQuery;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatMemoryService {

    private final ChatMemoryRepository chatMemoryRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    @Autowired
    private ChatMemoryMongoRepository chatMemoryMongoRepository;

    // In-memory fallback for local environments where OpenSearch is disabled or offline
    private final Map<String, List<ChatMemoryDocument>> inMemoryFallback = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public ChatMemoryService(
            ChatMemoryRepository chatMemoryRepository,
            ElasticsearchOperations elasticsearchOperations) {
        this.chatMemoryRepository = chatMemoryRepository;
        this.elasticsearchOperations = elasticsearchOperations;
        log.info("ChatMemoryService initialized with OpenSearch support.");
    }

    public ChatMemoryService() {
        this.chatMemoryRepository = null;
        this.elasticsearchOperations = null;
        log.warn("ChatMemoryService initialized WITHOUT OpenSearch. Falling back to in-memory conversation storage.");
    }

    private boolean isAvailable() {
        return chatMemoryRepository != null && elasticsearchOperations != null;
    }

    public void saveMessage(String userId, String role, String content) {
        ChatMemoryDocument doc = ChatMemoryDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .role(role)
                .content(content)
                .timestamp(System.currentTimeMillis())
                .build();

        // 1. Save to MongoDB for persistent backup
        if (chatMemoryMongoRepository != null) {
            try {
                chatMemoryMongoRepository.save(doc);
                log.info("Saved chat message to MongoDB for user {}", userId);
            } catch (Exception e) {
                log.warn("Failed to save chat message to MongoDB: {}", e.getMessage());
            }
        }

        // 2. Save to OpenSearch if available
        if (isAvailable()) {
            try {
                chatMemoryRepository.save(doc);
                log.info("Saved chat message to OpenSearch for user {}", userId);
                return;
            } catch (Exception e) {
                log.warn("Failed to save chat message to OpenSearch: {}", e.getMessage());
            }
        }

        // 3. In-memory fallback
        inMemoryFallback.computeIfAbsent(userId, k -> new ArrayList<>()).add(doc);
        log.info("Saved chat message in-memory for user {}", userId);
    }

    public List<ChatMemoryDocument> getRecentHistory(String userId, int limit) {
        // 1. Try OpenSearch
        if (isAvailable()) {
            try {
                List<ChatMemoryDocument> history = chatMemoryRepository.findByUserIdOrderByTimestampAsc(userId);
                if (history != null && !history.isEmpty()) {
                    if (history.size() > limit) {
                        return history.subList(history.size() - limit, history.size());
                    }
                    return history;
                }
            } catch (Exception e) {
                log.warn("Failed to retrieve chat history from OpenSearch: {}", e.getMessage());
            }
        }

        // 2. Fall back to MongoDB
        if (chatMemoryMongoRepository != null) {
            try {
                List<ChatMemoryDocument> history = chatMemoryMongoRepository.findByUserIdOrderByTimestampAsc(userId);
                if (history != null && !history.isEmpty()) {
                    if (history.size() > limit) {
                        return history.subList(history.size() - limit, history.size());
                    }
                    return history;
                }
            } catch (Exception e) {
                log.warn("Failed to retrieve chat history from MongoDB: {}", e.getMessage());
            }
        }

        // 3. In-memory fallback
        List<ChatMemoryDocument> memHistory = inMemoryFallback.getOrDefault(userId, Collections.emptyList());
        if (memHistory.size() > limit) {
            return memHistory.subList(memHistory.size() - limit, memHistory.size());
        }
        return new ArrayList<>(memHistory);
    }

    /**
     * Performs a search query against OpenSearch (or fallback list) to find the most semantically relevant
     * past conversation snippets.
     */
    public String getSemanticContext(String userId, String userQuery) {
        log.info("Searching semantic context for user {} with query [{}]", userId, userQuery);
        List<ChatMemoryDocument> matchingHits = new ArrayList<>();

        // 1. Try OpenSearch
        if (isAvailable()) {
            try {
                // Fuzzy multi-match query in OpenSearch for RAG (Retrieval-Augmented Generation) memory
                String fuzzyQuery = String.format(
                        "{\n" +
                        "  \"bool\": {\n" +
                        "    \"must\": [\n" +
                        "      { \"term\": { \"userId\": \"%s\" } },\n" +
                        "      { \"multi_match\": { \"query\": \"%s\", \"fields\": [\"content\"], \"fuzziness\": \"AUTO\" } }\n" +
                        "    ]\n" +
                        "  }\n" +
                        "}", userId, userQuery.replace("\"", "\\\""));

                Query searchQuery = new StringQuery(fuzzyQuery);
                SearchHits<ChatMemoryDocument> searchHits = elasticsearchOperations.search(searchQuery, ChatMemoryDocument.class);
                matchingHits = searchHits.getSearchHits().stream()
                        .map(SearchHit::getContent)
                        .limit(5)
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("OpenSearch semantic context search failed: {}", e.getMessage());
            }
        }

        // 2. Fall back to MongoDB keyword matching
        if (matchingHits.isEmpty() && chatMemoryMongoRepository != null) {
            try {
                List<ChatMemoryDocument> fullHistory = chatMemoryMongoRepository.findByUserIdOrderByTimestampAsc(userId);
                if (fullHistory != null && !fullHistory.isEmpty()) {
                    List<ChatMemoryDocument> sortedHistory = fullHistory.stream()
                            .sorted(Comparator.comparingLong(ChatMemoryDocument::getTimestamp).reversed())
                            .collect(Collectors.toList());
                    String[] keywords = userQuery.toLowerCase().split("\\s+");
                    for (ChatMemoryDocument doc : sortedHistory) {
                        String content = doc.getContent().toLowerCase();
                        for (String keyword : keywords) {
                            if (keyword.length() > 2 && content.contains(keyword)) {
                                matchingHits.add(doc);
                                break;
                            }
                        }
                        if (matchingHits.size() >= 5) {
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to search semantic context in MongoDB: {}", e.getMessage());
            }
        }

        // 3. Fall back to In-memory keyword search
        if (matchingHits.isEmpty()) {
            List<ChatMemoryDocument> fullHistory = inMemoryFallback.getOrDefault(userId, Collections.emptyList());
            if (!fullHistory.isEmpty()) {
                List<ChatMemoryDocument> sortedHistory = fullHistory.stream()
                        .sorted(Comparator.comparingLong(ChatMemoryDocument::getTimestamp).reversed())
                        .collect(Collectors.toList());
                String[] keywords = userQuery.toLowerCase().split("\\s+");
                for (ChatMemoryDocument doc : sortedHistory) {
                    String content = doc.getContent().toLowerCase();
                    for (String keyword : keywords) {
                        if (keyword.length() > 2 && content.contains(keyword)) {
                            matchingHits.add(doc);
                            break;
                        }
                    }
                    if (matchingHits.size() >= 5) {
                        break;
                    }
                }
            }
        }

        if (matchingHits.isEmpty()) {
            return "";
        }

        // Format the retrieved context for the AI prompt in chronological order
        return matchingHits.stream()
                .sorted(Comparator.comparingLong(ChatMemoryDocument::getTimestamp))
                .map(doc -> String.format("- %s: %s", doc.getRole().toUpperCase(), doc.getContent()))
                .collect(Collectors.joining("\n"));
    }
}
