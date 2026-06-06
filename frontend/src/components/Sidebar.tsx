"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, UploadCloud, FileText, GitBranch, 
  Layers, HelpCircle, GraduationCap, MessageSquare, 
  CreditCard, Users, ShieldAlert, LogOut, Sun, Moon 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tải lên tài liệu", href: "/upload", icon: UploadCloud },
    { name: "Tóm tắt AI", href: "/summary", icon: FileText },
    { name: "Sơ đồ kiến thức", href: "/knowledge-map", icon: GitBranch },
    { name: "Flashcard AI", href: "/flashcards", icon: Layers },
    { name: "Trắc nghiệm AI", href: "/quiz", icon: HelpCircle },
    { name: "Thi thử (Exam)", href: "/exam", icon: GraduationCap },
    { name: "AI Tutor Chat", href: "/tutor", icon: MessageSquare },
    { name: "Nâng cấp gói", href: "/billing", icon: CreditCard },
    { name: "Affiliate", href: "/affiliate", icon: Users },
  ];

  const isAdmin = user?.role === "admin";

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      html.classList.add("light");
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
    }
  };

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎓 StudyOS AI
          </span>
        </Link>
        <button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          title="Đổi giao diện"
        >
          <Sun className="h-4 w-4 block dark:hidden" />
          <Moon className="h-4 w-4 hidden dark:block" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-purple-600/20 text-purple-300 border-l-2 border-purple-500"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 ${
              pathname.startsWith("/admin")
                ? "bg-red-950/20 text-red-400 border-red-500"
                : "text-slate-400 hover:bg-red-950/10 hover:text-red-300 border-transparent"
            }`}
          >
            <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <Link 
          href="/profile" 
          className="flex items-center gap-3 mb-3 hover:bg-slate-800/40 p-1.5 rounded-lg transition-all group cursor-pointer"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm shadow-md overflow-hidden flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">
              {user?.full_name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                user?.tier === "premium" 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : user?.tier === "pro"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}>
                {user?.tier}
              </span>
            </div>
          </div>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 transition-colors border border-slate-700/50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
