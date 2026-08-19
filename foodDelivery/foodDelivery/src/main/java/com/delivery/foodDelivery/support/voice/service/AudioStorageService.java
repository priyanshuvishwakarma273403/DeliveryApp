package com.delivery.foodDelivery.support.voice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class AudioStorageService {

    private final String storageDir;

    public AudioStorageService() {
        // Create an audio-temp directory in the current working directory of the application
        this.storageDir = System.getProperty("user.dir") + File.separator + "audio-temp";
        try {
            Files.createDirectories(Paths.get(storageDir));
            log.info("Audio temp directory initialized at: {}", storageDir);
        } catch (Exception e) {
            log.error("Could not create audio-temp directory: {}", e.getMessage());
        }
    }

    /**
     * Downloads an audio file from a remote URL (like Exotel's RecordingUrl)
     * and saves it locally.
     * @param remoteUrl Remote URL of the audio file
     * @return Local File reference
     */
    public File downloadRecording(String remoteUrl) {
        try {
            log.info("Downloading remote audio from: {}", remoteUrl);
            String extension = ".mp3";
            if (remoteUrl.contains(".wav")) extension = ".wav";
            else if (remoteUrl.contains(".ogg")) extension = ".ogg";

            File tempFile = new File(storageDir + File.separator + "recording_" + UUID.randomUUID() + extension);
            
            URL url = new URL(remoteUrl);
            try (InputStream in = url.openStream();
                 FileOutputStream out = new FileOutputStream(tempFile)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
            log.info("Audio saved locally at: {}", tempFile.getAbsolutePath());
            return tempFile;
        } catch (Exception e) {
            log.error("Failed to download recording from {}: {}", remoteUrl, e.getMessage());
            return null;
        }
    }

    /**
     * Allocates a path for a new TTS output file.
     * @return Path to the file
     */
    public Path getTtsOutputPath() {
        return Paths.get(storageDir + File.separator + "tts_" + UUID.randomUUID() + ".mp3");
    }

    /**
     * Deletes a file.
     */
    public void deleteFile(File file) {
        if (file != null && file.exists()) {
            try {
                Files.delete(file.toPath());
            } catch (Exception e) {
                log.warn("Failed to delete temp audio file: {}", file.getName());
            }
        }
    }

    public String getPublicUrl(String filename) {
        // Maps to the custom resource handler mapping /ai/audio/temp/**
        return "/api/ai/audio/temp/" + filename;
    }
    
    public String getStorageDir() {
        return storageDir;
    }
}
