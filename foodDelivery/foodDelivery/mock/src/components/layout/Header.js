"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiArrowLeft, FiLogOut, FiUser } from "react-icons/fi";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Hide header on login/register pages
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) return null;

  // Identify if we can go back
  const isDashboard =
    pathname === "/customer/dashboard" ||
    pathname === "/partner/dashboard" ||
    pathname === "/admin/dashboard" ||
    pathname === "/";

  return (
    <header className="sticky top-0 w-full h-16 glass-panel flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        {!isDashboard && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all text-textPrimary"
            aria-label="Back"
          >
            <FiArrowLeft className="text-xl" />
          </button>
        )}
        <span className="font-bold text-xl tracking-wider text-primary">
          mock
        </span>
      </div>

      {isAuthenticated && user && (
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-semibold text-textPrimary">{user.name}</span>
            <span className="text-[10px] text-textSecondary uppercase tracking-widest">{user.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-textPrimary">
            <FiUser className="text-lg" />
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-primary/10 text-primary active:scale-95 transition-all"
            title="Log Out"
          >
            <FiLogOut className="text-lg" />
          </button>
        </div>
      )}
    </header>
  );
}
