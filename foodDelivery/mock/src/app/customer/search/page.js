"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiSearch, FiStar, FiClock, FiMapPin, FiX } from "react-icons/fi";

export default function CustomerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/restaurants/search?q=${encodeURIComponent(query)}`);
        setResults(response.data.data);
      } catch (error) {
        console.error("Error searching restaurants:", error);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex-1 px-6 py-6 space-y-6">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurant or cuisines..."
          className="w-full glass-input pl-11 pr-10 text-sm"
          autoFocus
        />
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary text-lg" />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-textSecondary"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Results Header */}
      {query && (
        <div className="flex justify-between items-center text-xs text-textSecondary uppercase tracking-widest">
          <span>Search Results</span>
          <span>{results.length} Found</span>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((res, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={res.id}
            >
              <a
                href={`/customer/restaurant/${res.id}`}
                className="flex gap-4 glass-panel p-3.5 rounded-2xl hover:border-white/12 transition-all active:scale-[0.99]"
              >
                <div className="relative w-20 h-20 bg-cardBg rounded-xl overflow-hidden flex-shrink-0">
                  {res.imageUrl ? (
                    <img
                      src={res.imageUrl}
                      alt={res.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-textSecondary">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="font-bold text-textPrimary text-sm truncate">
                      {res.name}
                    </h4>
                    <p className="text-xs text-textSecondary truncate mt-0.5">
                      {res.cuisineType}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-textSecondary">
                    <span className="flex items-center gap-1">
                      <FiStar className="fill-accent text-accent border-none text-[9px]" />
                      <span className="font-bold text-textPrimary">
                        {res.rating ? res.rating.toFixed(1) : "N/A"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock />
                      {res.avgDeliveryTime} mins
                    </span>
                    <span className="flex items-center gap-0.5 font-medium">
                      <FiMapPin className="text-[9px]" />
                      <span className="truncate max-w-[80px]">{res.city}</span>
                    </span>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      ) : query.trim() ? (
        <div className="glass-panel p-12 text-center text-textSecondary rounded-2xl text-sm">
          No restaurants or cuisines match your search.
        </div>
      ) : (
        <div className="p-12 text-center text-textSecondary text-xs tracking-wide">
          Type to search restaurants...
        </div>
      )}
    </div>
  );
}
