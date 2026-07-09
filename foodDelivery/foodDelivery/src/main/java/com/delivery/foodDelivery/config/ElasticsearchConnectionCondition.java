package com.delivery.foodDelivery.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.env.Environment;
import org.springframework.core.type.AnnotatedTypeMetadata;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;

/**
 * Validates that the configured OpenSearch/Elasticsearch server is online and reachable
 * before allowing Elasticsearch beans and repositories to be loaded.
 * Prevents application startup crashes on Render if Aiven OpenSearch is unreachable.
 */
public class ElasticsearchConnectionCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        Environment env = context.getEnvironment();
        
        // 1. Check if enabled property is set
        String enabled = env.getProperty("elasticsearch.enabled");
        if (enabled == null) {
            enabled = env.getProperty("OPENSEARCH_ENABLED");
        }
        if (!"true".equalsIgnoreCase(enabled)) {
            System.out.println("DEBUG: ElasticsearchConnectionCondition - Elasticsearch is disabled by property.");
            return false;
        }

        // 2. Resolve URIs
        String uris = env.getProperty("spring.elasticsearch.uris");
        if (uris == null) {
            uris = env.getProperty("OPENSEARCH_URL");
        }
        if (uris == null || uris.trim().isEmpty()) {
            System.out.println("DEBUG: ElasticsearchConnectionCondition - No OpenSearch URIs configured.");
            return false;
        }

        if (uris.contains(",")) {
            uris = uris.split(",")[0];
        }
        uris = uris.trim();
        if (!uris.startsWith("http")) {
            uris = "http://" + uris;
        }

        try {
            URI uri = URI.create(uris);
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 9200 : uri.getPort();

            System.out.println("DEBUG: ElasticsearchConnectionCondition - Testing connection to " + host + ":" + port);
            try (Socket socket = new Socket()) {
                // Try connecting with a 2-second timeout
                socket.connect(new InetSocketAddress(host, port), 2000);
                System.out.println("DEBUG: ElasticsearchConnectionCondition - Connection successful. Enabling Elasticsearch.");
                return true;
            }
        } catch (Exception e) {
            System.err.println("WARN: ElasticsearchConnectionCondition - OpenSearch host is unreachable (" + e.getMessage() + "). Disabling Elasticsearch config to prevent startup crash.");
            return false;
        }
    }
}
