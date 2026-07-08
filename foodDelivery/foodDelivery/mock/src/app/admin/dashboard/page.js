"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import useStomp from "@/hooks/useStomp";
import { motion } from "framer-motion";
import { FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign, FiVolume2, FiAlertCircle } from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Broadcast Notification Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(15);
  const [promoCode, setPromoCode] = useState("SUPERFOOD");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState("");

  const { connect, publish, connected } = useStomp();

  const loadStats = async () => {
    try {
      const response = await axiosInstance.get("/admin/analytics/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    connect();
  }, [connect]);

  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSendingBroadcast(true);
    setBroadcastResult("");

    try {
      const payload = {
        title,
        message,
        discountPercentage: discount,
        promoCode,
      };

      // 1. Post to backend Kafka emitter
      await axiosInstance.post("/admin/sales/start", payload);

      // 2. Broadcast in-app via STOMP WebSocket topic if connected
      if (connected) {
        publish("/topic/global-notifications", {
          title,
          message,
          promoCode,
          discount,
        });
      }

      setBroadcastResult("Broadcast trigger succeeded! Notifications sent.");
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error sending broadcast notification:", error);
      setBroadcastResult(error.response?.data?.message || "Failed to trigger broadcast.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20">
      <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
        Admin Console
      </h2>

      {/* Analytics stats widgets */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-primary">
          <FiDollarSign className="text-primary text-lg" />
          <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-3">Total Sales</span>
          <span className="text-lg font-black text-textPrimary mt-0.5">
            ₹{stats?.totalSales || stats?.revenue || 45900}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-accent">
          <FiShoppingBag className="text-accent text-lg" />
          <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-3">Orders Count</span>
          <span className="text-lg font-black text-textPrimary mt-0.5">
            {stats?.totalOrders || stats?.ordersCount || 104}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-success">
          <FiUsers className="text-success text-lg" />
          <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-3">Active Users</span>
          <span className="text-lg font-black text-textPrimary mt-0.5">
            {stats?.activeUsers || stats?.usersCount || 38}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-blue-500">
          <FiTrendingUp className="text-blue-500 text-lg" />
          <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-3">Active Outlets</span>
          <span className="text-lg font-black text-textPrimary mt-0.5">
            {stats?.activeRestaurants || stats?.restaurantsCount || 100}
          </span>
        </div>
      </div>

      {/* Global Broadcaster Form */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FiVolume2 className="text-lg" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-textPrimary">Global Broadcaster</h4>
            <p className="text-[10px] text-textSecondary">Kafka & WebSocket push notifications</p>
          </div>
        </div>

        {broadcastResult && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-3 flex items-center gap-2 text-xs">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{broadcastResult}</span>
          </div>
        )}

        <form onSubmit={handleBroadcastNotification} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
              Notification Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flash 50% Off Sale!"
              className="glass-input text-xs w-full"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
              Broadcast Message
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write message details..."
              rows={3}
              className="glass-input text-xs w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
                Discount (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="glass-input text-xs w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
                Promo Code
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="glass-input text-xs w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sendingBroadcast}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
          >
            {sendingBroadcast ? "Sending Broadcast..." : "Emit Broadcast"}
          </button>
        </form>
      </div>
    </div>
  );
}
