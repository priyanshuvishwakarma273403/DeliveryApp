"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiList, FiClock, FiMapPin, FiChevronRight } from "react-icons/fi";

export default function PartnerDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyDeliveries = async () => {
      try {
        const response = await axiosInstance.get("/delivery/partner/my");
        setDeliveries(response.data.data || []);
      } catch (error) {
        console.error("Error loading partner deliveries:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMyDeliveries();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20">
      <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase flex items-center gap-2">
        <FiList className="text-primary" /> My Deliveries
      </h2>

      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <div className="glass-panel p-10 text-center text-textSecondary rounded-2xl text-xs">
            You don't have any deliveries assigned yet.
          </div>
        ) : (
          deliveries.map((del, index) => {
            const statusColor =
              del.status === "DELIVERED"
                ? "text-success bg-success/10 border-success/20"
                : "text-accent bg-accent/10 border-accent/20";
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={del.id}
              >
                <Link
                  href={`/partner/delivery/${del.orderId || del.id}`}
                  className="block glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.99]"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-textPrimary">Delivery #{del.id}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>
                      {del.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-textSecondary space-y-1.5 mb-3">
                    <p className="flex items-center gap-1.5">
                      <FiMapPin className="text-[10px]" /> {del.deliveryAddress || "Address details in sheet"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FiClock className="text-[10px]" /> Assigned: {new Date(del.assignedAt || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-primary font-bold border-t border-white/5 pt-2">
                    <span>Manage tracking console</span>
                    <FiChevronRight />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
