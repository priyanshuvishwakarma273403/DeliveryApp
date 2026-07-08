"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto glass-panel p-8 rounded-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-wider text-primary">
            Welcome Back
          </h1>
          <p className="text-sm text-textSecondary mt-2">
            Log in to mock food delivery
          </p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error rounded-xl p-3 flex items-center gap-2 mb-6 text-xs">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiMail />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 glass-input text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiLock />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-10 glass-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 text-sm tracking-wider uppercase"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-xs text-textSecondary mt-8">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Register now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
