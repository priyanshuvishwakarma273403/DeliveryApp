"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import useStomp from "@/hooks/useStomp";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiMapPin, FiTruck, FiMessageSquare, FiSend, FiX, FiCheckCircle } from "react-icons/fi";

// Dynamically import TrackingMap to bypass SSR issues
const TrackingMap = dynamic(() => import("@/components/map/TrackingMap"), {
  ssr: false,
});

export default function OrderTracking() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time states
  const [riderLocation, setRiderLocation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);

  // Stomp WebSocket handlers
  const { connect, subscribe, publish, connected } = useStomp();

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${id}`);
        setOrder(response.data.data);
      } catch (error) {
        console.error("Error loading order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  // Connect & subscribe to channels
  useEffect(() => {
    if (!order || !user) return;

    connect(() => {
      // 1. Subscribe to order updates (placed, ready, out for delivery)
      subscribe(`/topic/order/${user.id}`, (updatedOrder) => {
        if (updatedOrder && updatedOrder.id === order.id) {
          setOrder(updatedOrder);
        }
      });

      // 2. Subscribe to live delivery location coordinates
      subscribe(`/topic/location/${order.id}`, (locationMsg) => {
        if (locationMsg && locationMsg.latitude) {
          setRiderLocation({
            latitude: locationMsg.latitude,
            longitude: locationMsg.longitude,
          });
        }
      });

      // 3. Subscribe to chat channel
      subscribe(`/topic/chat/${order.id}`, (chatMsg) => {
        setChatMessages((prev) => [...prev, chatMsg]);
      });
    });
  }, [order, user, connect, subscribe]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const chatMsg = {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: chatInput,
      timestamp: new Date().toISOString(),
    };

    publish(`/topic/chat/${order.id}`, chatMsg);
    setChatInput("");
  };

  // Mock static coords for Map (Delhi region)
  const restaurantCoords = { latitude: 28.6273, longitude: 77.3725 };
  const customerCoords = { latitude: 28.6139, longitude: 77.2090 };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-white/5 animate-spin" />
        <span className="text-xs text-textSecondary uppercase tracking-widest mt-4">
          Locating your delivery...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 px-6 py-20 text-center text-textSecondary">
        Order not found.
      </div>
    );
  }

  // Active status checks
  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
          Track Order #{order.id}
        </h2>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {order.status}
        </span>
      </div>

      {/* Map display */}
      <TrackingMap
        riderCoords={riderLocation || (isOutForDelivery ? restaurantCoords : null)}
        restaurantCoords={restaurantCoords}
        customerCoords={customerCoords}
      />

      {/* Status timeline */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider border-b border-white/5 pb-2">
          Delivery Status Timeline
        </h4>
        
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-success text-base flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-textPrimary">Order Placed</p>
              <p className="text-[10px] text-textSecondary">Wait for restaurant confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              order.status !== "PLACED" ? "bg-success" : "bg-white/10"
            }`}>
              {order.status !== "PLACED" && <FiCheckCircle className="text-white text-[10px]" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${order.status !== "PLACED" ? "text-textPrimary" : "text-textSecondary"}`}>
                Confirmed & Preparing
              </p>
              <p className="text-[10px] text-textSecondary">Kitchen is preparing your meal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED" ? "bg-success" : "bg-white/10"
            }`}>
              {(order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED") && <FiCheckCircle className="text-white text-[10px]" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${(order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED") ? "text-textPrimary" : "text-textSecondary"}`}>
                Out For Delivery
              </p>
              <p className="text-[10px] text-textSecondary">Rider is heading to your address</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-6 bg-primary hover:bg-primary-light text-white p-4 rounded-full shadow-2xl z-40 active:scale-90 transition-all flex items-center justify-center"
        title="Chat with Rider"
      >
        <FiMessageSquare className="text-xl" />
      </button>

      {/* Floating Chat Tray Overlay */}
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
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/5 bg-cardBg/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiMessageSquare />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-textPrimary uppercase">Chat with Rider</h4>
                    <p className="text-[8px] text-textSecondary uppercase tracking-wider">Order #{order.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-textSecondary"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-none">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-textSecondary text-xs py-20">
                    No messages yet. Say hello to your rider!
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.senderId === user.id;
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

              {/* Chat Input */}
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
                  className="bg-primary hover:bg-primary-light text-white p-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
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
