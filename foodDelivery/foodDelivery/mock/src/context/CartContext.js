"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axiosInstance from "@/api/axiosInstance";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated || (user && user.role !== "CUSTOMER")) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.get("/cart");
      setCart(response.data.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, user]);

  const addToCart = async (menuItemId, quantity = 1) => {
    try {
      const response = await axiosInstance.post("/cart/items", { menuItemId, quantity });
      setCart(response.data.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to add item to cart.";
    }
  };

  const updateItemQty = async (menuItemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(menuItemId);
    }
    try {
      const response = await axiosInstance.put(`/cart/items/${menuItemId}?quantity=${quantity}`);
      setCart(response.data.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to update item quantity.";
    }
  };

  const removeItem = async (menuItemId) => {
    try {
      const response = await axiosInstance.delete(`/cart/items/${menuItemId}`);
      setCart(response.data.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to remove item from cart.";
    }
  };

  const clearCart = async () => {
    try {
      await axiosInstance.delete("/cart");
      setCart(null);
    } catch (error) {
      throw error.response?.data?.message || "Failed to clear cart.";
    }
  };

  const cartCount = cart && cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        addToCart,
        updateItemQty,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
