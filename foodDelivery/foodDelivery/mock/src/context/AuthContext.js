"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axiosInstance from "@/api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for session data
    const token = localStorage.getItem("mock_accessToken");
    const storedUser = localStorage.getItem("mock_user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen for global logout events triggered by interceptor
    const handleLogout = () => {
      logout();
    };

    window.addEventListener("auth-logout", handleLogout);
    return () => {
      window.removeEventListener("auth-logout", handleLogout);
    };
  }, []);

  // Redirect based on authentication state and user roles
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/auth/login", "/auth/register"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublicRoute) {
        router.push("/auth/login");
      }
    } else {
      // Authenticated user trying to access login/register
      if (isPublicRoute || pathname === "/") {
        redirectBasedOnRole(user.role);
      }
      
      // Route Guards based on Role
      if (pathname.startsWith("/customer") && user.role !== "CUSTOMER") {
        redirectBasedOnRole(user.role);
      }
      if (pathname.startsWith("/partner") && user.role !== "DELIVERY_PARTNER") {
        redirectBasedOnRole(user.role);
      }
      if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
        redirectBasedOnRole(user.role);
      }
    }
  }, [user, pathname, loading]);

  const redirectBasedOnRole = (role) => {
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "DELIVERY_PARTNER") {
      router.push("/partner/dashboard");
    } else {
      router.push("/customer/dashboard");
    }
  };

  const sendOtp = async (email) => {
    try {
      const response = await axiosInstance.post(`/auth/send-otp?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to send verification OTP";
    }
  };

  const register = async (registerData) => {
    try {
      const response = await axiosInstance.post("/auth/register", registerData);
      const authData = response.data.data;
      
      localStorage.setItem("mock_accessToken", authData.accessToken);
      localStorage.setItem("mock_user", JSON.stringify(authData.user));
      setUser(authData.user);
      
      redirectBasedOnRole(authData.user.role);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Registration failed. Verify details.";
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/auth/login", { email, password });
      const authData = response.data.data;
      
      localStorage.setItem("mock_accessToken", authData.accessToken);
      localStorage.setItem("mock_user", JSON.stringify(authData.user));
      setUser(authData.user);
      
      redirectBasedOnRole(authData.user.role);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Invalid credentials.";
    }
  };

  const logout = () => {
    localStorage.removeItem("mock_accessToken");
    localStorage.removeItem("mock_user");
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        sendOtp,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
