"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function RegisterPage() {
  const { sendOtp, register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "CUSTOMER",
  });
  
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendOtp(formData.email);
      setOtpSentMessage(`Verification OTP sent to ${formData.email}`);
      setShowOtpModal(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        ...formData,
        otp: otp,
      });
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto glass-panel p-8 rounded-2xl"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider text-primary">
            Join mock
          </h1>
          <p className="text-sm text-textSecondary mt-2">
            Create your account to get started
          </p>
        </div>

        {error && !showOtpModal && (
          <div className="bg-error/10 border border-error/20 text-error rounded-xl p-3 flex items-center gap-2 mb-4 text-xs">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiUser />
              </span>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className="w-full pl-10 glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiMail />
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                className="w-full pl-10 glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiPhone />
              </span>
              <input
                type="tel"
                name="phone"
                required
                pattern="^(?:\+91|0)?[6-9]\d{9}$"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full pl-10 glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Delivery Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiMapPin />
              </span>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="Sector 62, Noida"
                className="w-full pl-10 glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary">
                <FiLock />
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full pl-10 glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5">
              Register As
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full glass-input text-xs cursor-pointer select-none bg-cardBg"
            >
              <option value="CUSTOMER">Customer (Order Food)</option>
              <option value="DELIVERY_PARTNER">Delivery Partner (Deliver Food)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 text-xs tracking-wider uppercase"
          >
            {loading ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        </form>

        <p className="text-center text-xs text-textSecondary mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Log In
          </Link>
        </p>
      </motion.div>

      {/* OTP Verification Modal Overlay */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-panel p-8 rounded-2xl"
            >
              <div className="text-center mb-6">
                <FiCheckCircle className="text-success text-4xl mx-auto mb-3" />
                <h3 className="text-xl font-bold text-textPrimary">
                  Verify Your Email
                </h3>
                <p className="text-xs text-textSecondary mt-2">
                  {otpSentMessage}
                </p>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 text-error rounded-xl p-3 flex items-center gap-2 mb-4 text-xs">
                  <FiAlertCircle className="text-base flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest mb-1.5 text-center">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full glass-input text-center text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 border border-white/10 hover:bg-white/5 text-textPrimary font-bold py-2.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-2.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
                  >
                    {loading ? "Verifying..." : "Verify & Sign Up"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
