package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.atomic.AtomicInteger;

@Component
public class WebSocketMetrics {

    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final Counter connectionsTotal;
    private final Counter errorsTotal;
    private final Counter messagesReceived;
    private final Counter messagesSent;

    public WebSocketMetrics(MeterRegistry registry) {
        Gauge.builder("ecommerce_websocket_connections_active", activeConnections, AtomicInteger::get)
                .description("Active WebSocket connections")
                .register(registry);

        this.connectionsTotal = Counter.builder("ecommerce_websocket_connections_total")
                .description("Total WebSocket connection events")
                .register(registry);

        this.errorsTotal = Counter.builder("ecommerce_websocket_errors_total")
                .description("Total WebSocket errors")
                .register(registry);

        this.messagesReceived = Counter.builder("ecommerce_websocket_messages_total")
                .tag("direction", "inbound")
                .description("Total WebSocket messages received")
                .register(registry);

        this.messagesSent = Counter.builder("ecommerce_websocket_messages_total")
                .tag("direction", "outbound")
                .description("Total WebSocket messages sent")
                .register(registry);
    }

    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        connectionsTotal.increment();
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        activeConnections.incrementAndGet();
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        activeConnections.decrementAndGet();
    }

    public void incrementReceived(Message<?> message) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && accessor.getMessageType() == org.springframework.messaging.simp.SimpMessageType.MESSAGE) {
            messagesReceived.increment();
        }
    }

    public void incrementSent(Message<?> message) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && accessor.getMessageType() == org.springframework.messaging.simp.SimpMessageType.MESSAGE) {
            messagesSent.increment();
        }
    }

    public void incrementError() {
        errorsTotal.increment();
    }
}
