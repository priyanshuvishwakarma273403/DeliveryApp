"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import useStomp from "@/hooks/useStomp";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiPhone, FiCheck, FiSend, FiMessageSquare, FiX, FiPlay } from "react-icons/fi";

export default function PartnerActiveDelivery() {
  const { id } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time tracking & simulation
  const [trackingActive, setTrackingActive] = useState(false);
  const simIntervalRef = useRef(null);
  const simulatedCoordsRef = useRef({ latitude: 28.6273, longitude: 77.3725 }); // Start at Noida Sector 62

  // Live Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);

  const { connect, subscribe, publish, connected } = useStomp();

  const loadDeliveryDetails = async () => {
    try {
      const response = await axiosInstance.get(`/delivery/order/${id}`);
      setDelivery(response.data.data);
    } catch (error) {
      console.error("Error loading delivery details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDeliveryDetails();
    }
  }, [id]);

  // Connect WebSockets
  useEffect(() => {
    if (!delivery) return;

    connect(() => {
      // Subscribe to chat
      subscribe(`/topic/chat/${delivery.orderId}`, (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });
    });
  }, [delivery, connect, subscribe]);

  // GPS Simulation Loop
  useEffect(() => {
    if (trackingActive && connected && delivery) {
      console.log("GPS Simulator Started.");
      simIntervalRef.current = setInterval(() => {
        // Slowly walk the coordinates towards customer (Delhi coordinates)
        const current = simulatedCoordsRef.current;
        const target = { latitude: 28.6139, longitude: 77.2090 };
        
        const deltaLat = (target.latitude - current.latitude) * 0.05; // 5% closer each step
        const deltaLng = (target.longitude - current.longitude) * 0.05;

        const nextCoords = {
          latitude: current.latitude + deltaLat,
          longitude: current.longitude + deltaLng,
        };

        simulatedCoordsRef.current = nextCoords;

        // Publish to STOMP destination
        publish(`/app/location/${delivery.orderId}`, nextCoords);
        console.log("GPS Location update sent:", nextCoords);
      }, 3000); // Send updates every 3 seconds
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        console.log("GPS Simulator Paused.");
      }
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [trackingActive, connected, delivery, publish]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const handleMarkPickedUp = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.post(`/delivery/partner/order/${delivery.orderId}/pickup`);
      await loadDeliveryDetails();
      // Auto start tracking when picked up
      setTrackingActive(true);
    } catch (error) {
      console.error("Error picking up order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.post(`/delivery/partner/order/${delivery.orderId}/deliver`);
      await loadDeliveryDetails();
      setTrackingActive(false);
    } catch (error) {
      console.error("Error delivering order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !delivery) return;

    const chatMsg = {
      senderId: delivery.partnerId,
      senderName: "Delivery Rider",
      senderRole: "DELIVERY_PARTNER",
      text: chatInput,
      timestamp: new Date().toISOString(),
    };

    publish(`/topic/chat/${delivery.orderId}`, chatMsg);
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex-1 px-6 py-20 text-center text-textSecondary">
        Delivery details not found.
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
          Delivery Console #{delivery.id}
        </h2>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {delivery.status}
        </span>
      </div>

      {/* Customer Info Card */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-start border-b border-white/5 pb-3">
          <div>
            <h4 className="font-bold text-sm text-textPrimary">Customer Info</h4>
            <p className="text-xs text-textSecondary mt-0.5">Order ID: {delivery.orderId}</p>
          </div>
          <a
            href={`tel:${delivery.deliveryPhone || "9876543210"}`}
            className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center text-success active:scale-90 transition-all"
            title="Call Customer"
          >
            <FiPhone className="text-sm" />
          </a>
        </div>

        <div className="text-xs text-textSecondary space-y-2">
          <p className="flex items-center gap-1.5">
            <FiMapPin className="text-[10px] text-primary" />
            <span className="font-semibold text-textPrimary">{delivery.deliveryAddress}</span>
          </p>
          <p>
            <span className="font-semibold text-textPrimary">Instructions: </span>
            {delivery.notes || "None"}
          </p>
        </div>
      </div>

      {/* GPS Switch Controller */}
      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-primary">
        <div>
          <h4 className="font-bold text-xs text-textPrimary uppercase tracking-wider">GPS Active Tracker</h4>
          <p className="text-[10px] text-textSecondary mt-0.5">Simulate live position broadcast</p>
        </div>
        <button
          onClick={() => setTrackingActive(!trackingActive)}
          disabled={delivery.status !== "ACCEPTED" && delivery.status !== "PICKED_UP"}
          className={`w-12 h-6 rounded-full p-1 transition-all ${
            trackingActive ? "bg-success" : "bg-white/10"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-all transform ${
              trackingActive ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {delivery.status === "ASSIGNED" || delivery.status === "ACCEPTED" ? (
          <button
            onClick={handleMarkPickedUp}
            disabled={actionLoading}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
          >
            <FiPlay /> {actionLoading ? "Processing..." : "Pick Up Order"}
          </button>
        ) : delivery.status === "PICKED_UP" ? (
          <button
            onClick={handleMarkDelivered}
            disabled={actionLoading}
            className="w-full bg-success hover:bg-success/90 text-white font-bold py-4 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-success/10"
          >
            <FiCheck /> {actionLoading ? "Processing..." : "Complete Delivery"}
          </button>
        ) : (
          <div className="glass-panel p-5 rounded-2xl text-center text-success font-bold text-xs uppercase tracking-widest border border-success/20">
            Delivery Complete
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-6 bg-primary hover:bg-primary-light text-white p-4 rounded-full shadow-2xl z-40 active:scale-90 transition-all flex items-center justify-center"
        title="Chat with Customer"
      >
        <FiMessageSquare className="text-xl" />
      </button>

      {/* Chat Tray Overlay */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-[480px] bg-darkBg border-t border-white/10 rounded-t-3xl h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 bg-cardBg/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiMessageSquare />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-textPrimary uppercase">Chat with Customer</h4>
                    <p className="text-[8px] text-textSecondary uppercase tracking-wider">Order #{delivery.orderId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-textSecondary"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-none">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-textSecondary text-xs py-20">
                    No messages yet. Update your customer!
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.senderRole === "DELIVERY_PARTNER";
                    return (
                      <div
                        key={index}
                        className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] text-textSecondary mb-0.5">{msg.senderName}</span>
                        <div
                          className={`p-3 rounded-2xl text-xs ${
                            isMe
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-cardBg border border-white/5 text-textPrimary rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 glass-input text-xs py-3 px-4"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-primary hover:bg-primary-light text-white p-3 rounded-xl active:scale-95 transition-all"
                >
                  <FiSend className="text-xs" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
