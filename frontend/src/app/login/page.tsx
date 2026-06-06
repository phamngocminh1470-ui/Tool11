"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { LogIn, Github, Mail, Lock, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthMock = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);
    try {
      const mockEmail = `oauth_${provider}_${Math.floor(Math.random() * 1000)}@gmail.com`;
      const mockName = `${provider.toUpperCase()} Demo User`;
      const mockAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${mockEmail}`;
      
      const response = provider === "google" 
        ? await api.loginGoogle(mockEmail, mockName, mockAvatar)
        : await api.loginGithub(mockEmail, mockName, mockAvatar);
        
      localStorage.setItem("studyos_token", response.access_token);
      localStorage.setItem("studyos_user", JSON.stringify(response.user));
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Đăng nhập mạng xã hội thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="glow-spot bg-purple-600/40 top-[-10%] left-[20%]" />
      <div className="glow-spot bg-blue-600/40 bottom-[-10%] right-[20%]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎓 StudyOS AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Hệ thống học tập tối ưu hóa bằng trí tuệ nhân tạo
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-purple-400" />
            Đăng nhập tài khoản
          </h2>

          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <span className="absolute w-full border-t border-slate-800"></span>
            <span className="relative px-3 bg-slate-950/20 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Hoặc đăng nhập với
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthMock("google")}
              disabled={loading}
              className="py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuthMock("github")}
              disabled={loading}
              className="py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Github className="h-4 w-4" />
              Github
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
