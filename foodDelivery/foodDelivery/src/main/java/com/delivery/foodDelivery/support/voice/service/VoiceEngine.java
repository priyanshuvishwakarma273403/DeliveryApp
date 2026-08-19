package com.delivery.foodDelivery.support.voice.service;

import java.io.File;

public interface VoiceEngine {
    
    /**
     * Transcribe speech audio file or URL to text.
     * @param audioUrl URL of the audio file to transcribe
     * @return Transcribed text
     */
    String transcribe(String audioUrl);

    /**
     * Synthesize text to speech and return a URL or file path to play.
     * @param text Text to synthesize
     * @param voiceLanguage Language preference (e.g. "hi-IN" or "en-IN")
     * @return Publicly accessible URL or server-hosted path of the synthesized audio file
     */
    String synthesize(String text, String voiceLanguage);
}
