package com.delivery.foodDelivery.support.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Data
public class VoiceSupportConfig {

    @Value("${exotel.exophone:08047280783}")
    private String exophone;

    @Value("${human.agent.phone:9369420619}")
    private String humanAgentPhone;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${voice.support.refund.limit:1000.0}")
    private double maxAutoRefundLimit;

    @Value("${voice.support.cancel.window-minutes:5}")
    private int orderCancelWindowMinutes;
}
