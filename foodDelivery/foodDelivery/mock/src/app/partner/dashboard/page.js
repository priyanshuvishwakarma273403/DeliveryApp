"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiTrendingUp, FiShoppingBag, FiTruck, FiCheck, FiSettings, FiActivity } from "react-icons/fi";

export default function PartnerDashboard() {
  const [stats, setStats] = useState({ totalDeliveries: 12, vehicle: "Bike (UP-16-AB-8392)", active: true });
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadAvailableOrders = async () => {
    try {
      const response = await axiosInstance.get("/delivery/partner/available");
      setAvailableOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching available orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await axiosInstance.post(`/delivery/partner/order/${orderId}/accept`);
      await loadAvailableOrders();
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order.");
    } finally {
      setAcceptingId(null);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
          Partner Board
        </h2>
        <span className="bg-success/15 border border-success/20 text-success text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <FiActivity className="text-xs" /> Duty Active
        </span>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col">
          <FiCheck className="text-success text-xl mb-2" />
          <span className="text-[10px] text-textSecondary uppercase tracking-widest">Deliveries</span>
          <span className="text-xl font-black text-textPrimary mt-1">
            {stats.totalDeliveries} Completed
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col">
          <FiTruck className="text-primary text-xl mb-2" />
          <span className="text-[10px] text-textSecondary uppercase tracking-widest">Vehicle</span>
          <span className="text-xs font-bold text-textPrimary mt-1 truncate">
            {stats.vehicle}
          </span>
        </div>
      </div>

      {/* Available Orders List */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest border-b border-white/5 pb-2">
          Available Orders For Pickup
        </h3>

        {availableOrders.length === 0 ? (
          <div className="glass-panel p-10 text-center text-textSecondary rounded-2xl text-xs">
            No active orders waiting for pickup in your region.
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={order.id}
                className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-4"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-textPrimary">Order #{order.id}</span>
                  <span className="text-primary font-bold">₹{order.totalAmount}</span>
                </div>
                <div className="text-[11px] text-textSecondary space-y-1.5">
                  <p>
                    <span className="font-bold text-textPrimary">Outlet: </span>
                    {order.restaurantName || `Restaurant #${order.restaurantId}`}
                  </p>
                  <p>
                    <span className="font-bold text-textPrimary">Delivery Address: </span>
                    {order.deliveryAddress}
                  </p>
                  <p>
                    <span className="font-bold text-textPrimary">Notes: </span>
                    {order.notes || "None"}
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={acceptingId === order.id}
                  className="w-full bg-primary hover:bg-primary-light text-white text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
                >
                  {acceptingId === order.id ? "Accepting..." : "Accept Delivery"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
