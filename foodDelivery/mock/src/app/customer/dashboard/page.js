"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiMapPin, FiSearch, FiStar, FiClock, FiDollarSign, FiAward, FiCoffee, FiTrendingUp, FiCpu } from "react-icons/fi";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch open restaurants
        const restResponse = await axiosInstance.get("/restaurants");
        setRestaurants(restResponse.data.data);

        // Fetch wallet details
        if (user) {
          const walletResponse = await axiosInstance.get(`/wallets/user/${user.id}`);
          setWallet(walletResponse.data.data);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Categories defined with icons
  const categories = [
    { name: "ALL", icon: FiTrendingUp },
    { name: "VEG", icon: FiAward },
    { name: "NON_VEG", icon: FiCoffee },
  ];

  // Filter restaurants by cuisine / category
  const filteredRestaurants = selectedCategory === "ALL" 
    ? restaurants 
    : restaurants.filter((r) => {
        if (selectedCategory === "VEG") return r.cuisineType?.toLowerCase().includes("salad") || r.cuisineType?.toLowerCase().includes("healthy");
        if (selectedCategory === "NON_VEG") return !r.cuisineType?.toLowerCase().includes("salad") && !r.cuisineType?.toLowerCase().includes("healthy");
        return true;
      });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-white/5 animate-spin" />
        <span className="text-xs text-textSecondary tracking-widest uppercase">
          Loading gourmet options...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6">
      {/* Wallet Balance Board */}
      {wallet && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-accent"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <FiDollarSign className="text-xl" />
            </div>
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">
                Your Coins Wallet
              </p>
              <h3 className="text-xl font-bold text-textPrimary">
                {wallet.coins} Coins
              </h3>
            </div>
          </div>
          <Link
            href="/customer/wallet"
            className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
          >
            History
          </Link>
        </motion.div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-textSecondary">
            Deliver to
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-textPrimary mt-0.5">
            <FiMapPin className="text-primary" />
            <span className="truncate max-w-[200px]">
              {user?.address || "Select Address"}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input bar & AI Button Grid */}
      <div className="grid grid-cols-5 gap-3">
        <Link href="/customer/search" className="col-span-4 block">
          <div className="flex items-center gap-3 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 h-[50px] text-textSecondary active:scale-[0.99] transition-all cursor-pointer">
            <FiSearch className="text-lg text-textSecondary" />
            <span className="text-xs truncate">Search restaurant or cuisines...</span>
          </div>
        </Link>
        <Link href="/customer/ai-chat" className="col-span-1 block">
          <div className="flex items-center justify-center bg-primary/10 border border-primary/20 rounded-xl h-[50px] text-primary active:scale-[0.99] transition-all cursor-pointer hover:bg-primary/15" title="Ask AI Assistant">
            <FiCpu className="text-xl animate-pulse" />
          </div>
        </Link>
      </div>

      {/* Category Selection Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
          Categories
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 border-white/5 text-textSecondary hover:border-white/10"
                }`}
              >
                <Icon className="text-sm" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurants List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
            Available Restaurants
          </h4>
          <span className="text-[10px] text-textSecondary font-semibold">
            {filteredRestaurants.length} OUTLETS
          </span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="glass-panel p-8 text-center text-textSecondary rounded-2xl text-sm">
            No restaurants found matching this category.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRestaurants.map((res, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={res.id}
              >
                <Link
                  href={`/customer/restaurant/${res.id}`}
                  className="block glass-panel overflow-hidden rounded-2xl hover:border-white/15 hover:shadow-lg transition-all active:scale-[0.99] duration-300"
                >
                  <div className="relative h-40 bg-cardBg w-full">
                    {res.imageUrl ? (
                      <img
                        src={res.imageUrl}
                        alt={res.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-textSecondary">
                        No Image Available
                      </div>
                    )}
                    {!res.open && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-error text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                          Closed
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-textPrimary text-base truncate">
                        {res.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                        <FiStar className="fill-accent text-[10px]" />
                        <span>{res.rating ? res.rating.toFixed(1) : "N/A"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-textSecondary truncate">
                      {res.cuisineType} &bull; {res.address}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-textSecondary border-t border-white/5 pt-2 mt-2">
                      <span className="flex items-center gap-1">
                        <FiClock />
                        {res.avgDeliveryTime} mins
                      </span>
                      <span>
                        Min. Order: ₹{res.minOrderAmount}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
