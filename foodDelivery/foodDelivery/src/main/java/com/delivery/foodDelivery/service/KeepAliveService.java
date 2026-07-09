package com.delivery.foodDelivery.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service to prevent Render from going to sleep on the free tier.
 * It pings its own public health check endpoint every 5 minutes.
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    // Injected automatically by Render (RENDER_EXTERNAL_URL) or set in env variables
    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    // Run every 5 minutes: 5 * 60 * 1000 = 300000 ms
    @Scheduled(fixedRate = 300000)
    public void pingSelf() {
        if (renderExternalUrl == null || renderExternalUrl.trim().isEmpty()) {
            log.info("KeepAliveService: RENDER_EXTERNAL_URL is not set. Skipping self-ping.");
            return;
        }

        try {
            String baseUrl = renderExternalUrl.trim();
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            
            // Build the public ping URL (context path is /api)
            String pingUrl = baseUrl + "/api/health/ping";

            log.info("KeepAliveService: Pinging self at {}", pingUrl);
            String response = restTemplate.getForObject(pingUrl, String.class);
            log.info("KeepAliveService: Ping response: {}", response);
        } catch (Exception e) {
            log.warn("KeepAliveService: Ping failed: {}", e.getMessage());
        }
    }
}
