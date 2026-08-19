package com.delivery.foodDelivery.support.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class VoiceMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String path = "file:" + System.getProperty("user.dir") + File.separator + "audio-temp" + File.separator;
        // Serving audio assets publicly at /api/ai/audio/temp/filename.mp3
        registry.addResourceHandler("/ai/audio/temp/**")
                .addResourceLocations(path);
    }
}
