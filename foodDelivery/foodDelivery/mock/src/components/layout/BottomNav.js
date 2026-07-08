"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  FiHome,
  FiSearch,
  FiShoppingCart,
  FiCreditCard,
  FiGlobe,
  FiTruck,
  FiList,
  FiUser,
  FiTrendingUp,
  FiServer,
  FiLayers,
  FiUsers,
} from "react-icons/fi";

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Hide bottom nav on auth screens
  if (!isAuthenticated || !user || pathname.startsWith("/auth")) {
    return null;
  }

  // Get items based on role
  let navItems = [];

  if (user.role === "CUSTOMER") {
    navItems = [
      { label: "Home", href: "/customer/dashboard", icon: FiHome },
      { label: "Search", href: "/customer/search", icon: FiSearch },
      { label: "Feed", href: "/customer/social", icon: FiGlobe },
      { label: "Wallet", href: "/customer/wallet", icon: FiCreditCard },
      { label: "Cart", href: "/customer/cart", icon: FiShoppingCart, badge: cartCount },
    ];
  } else if (user.role === "DELIVERY_PARTNER") {
    navItems = [
      { label: "Board", href: "/partner/dashboard", icon: FiTruck },
      { label: "My Orders", href: "/partner/deliveries", icon: FiList },
    ];
  } else if (user.role === "ADMIN") {
    navItems = [
      { label: "Analytics", href: "/admin/dashboard", icon: FiTrendingUp },
      { label: "Outlets", href: "/admin/restaurants", icon: FiServer },
      { label: "Menus", href: "/admin/menu", icon: FiLayers },
      { label: "Users", href: "/admin/users", icon: FiUsers },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-20 glass-nav border-t border-white/5 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center relative w-14 h-14 active:scale-95 transition-all duration-300"
          >
            <Icon
              className={`text-2xl transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-textSecondary"
              }`}
            />
            <span
              className={`text-[9px] mt-1 tracking-wider font-medium transition-all duration-300 ${
                isActive ? "text-primary font-semibold" : "text-textSecondary"
              }`}
            >
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-dark-bg animate-bounce">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
