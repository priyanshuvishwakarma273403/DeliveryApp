package com.delivery.foodDelivery.support.exotel.model;

public class ExoMLResponse {

    private final StringBuilder xml = new StringBuilder();

    public ExoMLResponse() {
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n");
    }

    public ExoMLResponse play(String audioUrl) {
        xml.append("    <Play>").append(audioUrl).append("</Play>\n");
        return this;
    }

    public ExoMLResponse speak(String text) {
        // Exotel supports Say/Speak or standard TTS via some setups.
        // We'll wrap in Say tag which is commonly supported.
        xml.append("    <Say>").append(text).append("</Say>\n");
        return this;
    }

    public ExoMLResponse record(String actionUrl, int maxLength, int timeout, boolean playBeep) {
        xml.append("    <Record action=\"")
           .append(actionUrl)
           .append("\" method=\"POST\" maxLength=\"")
           .append(maxLength)
           .append("\" timeout=\"")
           .append(timeout)
           .append("\" playBeep=\"")
           .append(playBeep)
           .append("\" />\n");
        return this;
    }

    public ExoMLResponse dial(String phoneNumber) {
        xml.append("    <Dial>").append(phoneNumber).append("</Dial>\n");
        return this;
    }

    public ExoMLResponse hangup() {
        xml.append("    <Hangup />\n");
        return this;
    }

    public String build() {
        return xml.toString() + "</Response>";
    }
}
