package com.delivery.foodDelivery.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
@Slf4j
public class RenderKeepAliveScheduler {

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Ping the application itself every 5 minutes to prevent Render free instance sleep.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 ms
    public void pingSelf() {
        String targetUrl = renderExternalUrl;
        if (targetUrl == null || targetUrl.isBlank()) {
            log.info("[KEEP-ALIVE] RENDER_EXTERNAL_URL is not set. Skipping self-ping in local development.");
            return;
        }

        // Ensure context path is added
        if (!targetUrl.endsWith("/")) {
            targetUrl += "/";
        }
        String pingUrl = targetUrl + "api/actuator/health";

        log.info("[KEEP-ALIVE] Sending periodic keep-alive ping to: {}", pingUrl);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(pingUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("[KEEP-ALIVE] Ping status: {}, Response: {}", response.statusCode(), response.body());
        } catch (Exception e) {
            log.error("[KEEP-ALIVE] Failed to ping self: {}", e.getMessage());
        }
    }
}
