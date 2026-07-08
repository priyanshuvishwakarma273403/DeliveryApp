"use client";

import React from "react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-t-primary border-white/5 animate-spin" />
      <span className="text-xs text-textSecondary tracking-widest uppercase">
        Verifying Session...
      </span>
    </div>
  );
}
