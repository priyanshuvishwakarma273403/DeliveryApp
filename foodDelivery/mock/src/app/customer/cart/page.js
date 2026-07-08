"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiMapPin, FiFileText } from "react-icons/fi";

export default function CustomerCart() {
  const { cart, updateItemQty, removeItem, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const deliveryFee = calculateSubtotal() > 500 ? 0 : 40;
  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) return;
    setLoading(true);

    try {
      const orderPayload = {
        deliveryAddress: address,
        phone,
        notes,
      };

      const response = await axiosInstance.post("/orders", orderPayload);
      const placedOrder = response.data.data;
      
      // Clear the local cart context
      await clearCart();
      
      // Redirect to specific tracking screen
      router.push(`/customer/orders/${placedOrder.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-textSecondary">
          <FiShoppingCart className="text-2xl" />
        </div>
        <span className="text-sm text-textSecondary font-semibold">Your shopping cart is empty.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20">
      <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase">
        Checkout Cart
      </h2>

      {/* Cart Items List */}
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.menuItemId}
            className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5"
          >
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-textPrimary text-sm truncate">
                {item.name}
              </h4>
              <p className="text-xs text-textSecondary mt-0.5">
                ₹{item.price} each
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface text-white rounded-lg text-xs font-bold py-1 px-2">
                <button
                  onClick={() => updateItemQty(item.menuItemId, item.quantity - 1)}
                  className="p-1 hover:bg-white/10 rounded-md transition-all"
                >
                  <FiMinus />
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button
                  onClick={() => updateItemQty(item.menuItemId, item.quantity + 1)}
                  className="p-1 hover:bg-white/10 rounded-md transition-all"
                >
                  <FiPlus />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.menuItemId)}
                className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-xl transition-all"
                title="Remove Item"
              >
                <FiTrash2 className="text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Address & Contact Forms */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-textPrimary tracking-wider uppercase border-b border-white/5 pb-2">
          Delivery Details
        </h4>

        <div className="flex flex-col">
          <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1">
            <FiMapPin className="text-primary" /> Delivery Address
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address..."
            className="glass-input text-xs"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
            Contact Number
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number..."
            className="glass-input text-xs"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1">
            <FiFileText /> Special Delivery Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (e.g. Leave with guard, ring bell)"
            rows={2}
            className="glass-input text-xs resize-none"
          />
        </div>
      </div>

      {/* Total Calculations */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex justify-between items-center text-xs text-textSecondary">
          <span>Cart Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-textSecondary">
          <span>Delivery Charges</span>
          <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-textPrimary border-t border-white/5 pt-3 mt-2">
          <span>Grand Total</span>
          <span className="text-primary text-base">₹{grandTotal}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading || !address.trim() || !phone.trim()}
        className="w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-primary/20"
      >
        {loading ? "Placing Order..." : "Confirm & Place Order"}
      </button>
    </div>
  );
}
