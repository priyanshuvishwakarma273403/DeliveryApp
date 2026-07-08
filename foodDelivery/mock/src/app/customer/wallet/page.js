"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiCreditCard, FiAward, FiDollarSign, FiShare2, FiArrowRight } from "react-icons/fi";

export default function CustomerWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        if (user) {
          const response = await axiosInstance.get(`/wallets/user/${user.id}`);
          setWallet(response.data.data);
        }
      } catch (error) {
        console.error("Error loading wallet details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadWallet();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6">
      <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
        My Wallet
      </h2>

      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-accent relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-accent/5 pointer-events-none">
          <FiCreditCard className="text-[120px]" />
        </div>

        <div className="space-y-1 z-10">
          <p className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">
            Available Coins
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-textPrimary">
              {wallet ? wallet.coins : 0}
            </span>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Coins
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-textSecondary border-t border-white/5 pt-4 mt-6 z-10">
          <span>Wallet ID: MOCK-{wallet?.id || "N/A"}</span>
          <span>Active</span>
        </div>
      </motion.div>

      {/* Play-To-Earn Coins Guide */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <FiAward className="text-lg" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-textPrimary">
              Earn Free Coins
            </h4>
            <p className="text-[10px] text-textSecondary">
              Participate in the mock social loop
            </p>
          </div>
        </div>

        <p className="text-xs text-textSecondary leading-relaxed">
          You can earn **50 Coins** instantly for every food photo you upload to the social feed! These coins are directly credited to your wallet and can be spent on checkout.
        </p>

        <Link
          href="/customer/social"
          className="flex items-center justify-between bg-white/5 hover:bg-white/10 text-xs font-bold text-accent py-3 px-4 rounded-xl active:scale-95 transition-all group"
        >
          <span className="flex items-center gap-2">
            <FiShare2 /> Upload to Social Feed
          </span>
          <FiArrowRight className="group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Mock Terms */}
      <div className="p-4 text-center text-[10px] text-textSecondary leading-relaxed">
        Mock coins are simulated utility tokens for testing the application checkout loop. No real fiat currencies are processed in mock wallet transactions.
      </div>
    </div>
  );
}
