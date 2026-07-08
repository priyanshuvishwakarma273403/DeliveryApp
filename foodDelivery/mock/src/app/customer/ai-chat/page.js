"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiCpu, FiSend, FiUser } from "react-icons/fi";

export default function CustomerAiChat() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load initial greeting
  useEffect(() => {
    setMessages([
      {
        sender: "ai",
        text: `Hello ${user?.name || "there"}! I am your mock AI assistant. Ask me anything about menus, cuisines, or suggestions!`,
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");
    setLoading(true);

    try {
      const response = await axiosInstance.post("/ai/chat", { message: messageToSend });
      const botMessage = {
        sender: "ai",
        text: response.data.data || "I couldn't process that suggestion.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI chatbot error:", error);
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I am facing an issue connecting with the AI engine. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] pb-[80px]">
      {/* AI Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-cardBg/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <FiCpu className="text-xl" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
            AI Assistant
          </h3>
          <p className="text-[9px] text-success font-semibold uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" /> Online
          </p>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-none">
        {messages.map((msg, index) => {
          const isAi = msg.sender === "ai";
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${isAi ? "" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  isAi ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface border-white/10 text-textPrimary"
                }`}
              >
                {isAi ? <FiCpu className="text-xs" /> : <FiUser className="text-xs" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isAi
                    ? "bg-cardBg border border-white/5 text-textPrimary rounded-tl-none"
                    : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-pulse">
              <FiCpu className="text-xs" />
            </div>
            <div className="bg-cardBg border border-white/5 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-white/5 bg-darkBg">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI what to order..."
            className="w-full glass-input pr-12 pl-4 py-3.5 text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-light text-white p-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-90"
          >
            <FiSend className="text-xs" />
          </button>
        </div>
      </form>
    </div>
  );
}
