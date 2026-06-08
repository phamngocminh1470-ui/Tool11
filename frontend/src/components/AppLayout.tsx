"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";

// ErrorBoundary to prevent cascading UI crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4 p-8">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-200">Đã xảy ra lỗi hiển thị</h2>
          <p className="text-sm text-slate-500 text-center max-w-md">
            {this.state.error?.message || "Lỗi không xác định"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold cursor-pointer transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Safety timeout: never show loading spinner for more than 5 seconds
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
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
    <div className="app-layout-root min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Content Area — NO overlays, NO glow divs, NO fixed layers */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col relative">
        <div className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
