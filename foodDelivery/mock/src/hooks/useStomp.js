"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useStomp() {
  const stompClientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const activeSubscriptionsRef = useRef({});

  // Connect to STOMP Broker
  const connect = useCallback((onConnectedCallback) => {
    if (typeof window === "undefined") return;
    if (stompClientRef.current && stompClientRef.current.active) return;

    const token = localStorage.getItem("mock_accessToken");
    if (!token) {
      console.warn("WebSocket CONNECT skipped: No JWT token found.");
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws";

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg) => {
        // Suppress noisy logs in production, active for debugging
        console.log("[STOMP Debug]:", msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log("WebSocket connected successfully:", frame);
      setConnected(true);
      if (onConnectedCallback) onConnectedCallback();
    };

    client.onDisconnect = () => {
      console.log("WebSocket disconnected.");
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("STOMP error occurred:", frame.headers["message"]);
      setConnected(false);
    };

    client.activate();
    stompClientRef.current = client;
  }, []);

  // Disconnect STOMP Client
  const disconnect = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      setConnected(false);
      activeSubscriptionsRef.current = {};
      console.log("WebSocket connection deactivated.");
    }
  }, []);

  // Subscribe to destination
  const subscribe = useCallback((destination, callback) => {
    if (!stompClientRef.current || !connected) {
      console.warn(`STOMP Subscribe failed for ${destination}: client not connected.`);
      return null;
    }

    // Avoid duplicate subscriptions on the same client lifecycle
    if (activeSubscriptionsRef.current[destination]) {
      return activeSubscriptionsRef.current[destination];
    }

    const subscription = stompClientRef.current.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        // Fallback for non-JSON strings
        callback(message.body);
      }
    });

    activeSubscriptionsRef.current[destination] = subscription;
    console.log(`STOMP Subscribed to: ${destination}`);

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
        delete activeSubscriptionsRef.current[destination];
        console.log(`STOMP Unsubscribed from: ${destination}`);
      },
    };
  }, [connected]);

  // Publish to destination
  const publish = useCallback((destination, body) => {
    if (!stompClientRef.current || !connected) {
      console.warn(`STOMP Publish failed for ${destination}: client not connected.`);
      return;
    }

    stompClientRef.current.publish({
      destination,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    console.log(`STOMP Published to ${destination}`);
  }, [connected]);

  // Auto clean up connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    subscribe,
    publish,
    connected,
  };
}
