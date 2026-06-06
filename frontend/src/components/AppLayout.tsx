"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
          <Loader2 className="absolute h-6 w-6 text-purple-400 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Đang khởi tạo StudyOS...
        </p>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Dynamic glow blobs */}
      <div className="glow-spot bg-purple-600 top-10 left-10" />
      <div className="glow-spot bg-blue-600 bottom-10 right-10" />
      
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Content Area */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col relative z-10">
        <div className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
