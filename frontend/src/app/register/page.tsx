"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Mail, Lock, User, UserCheck, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("ref");
    if (code) {
      setRefCode(code);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        referred_by: refCode || undefined
      });
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Email có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
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
            <UserPlus className="h-5 w-5 text-purple-400" />
            Đăng ký tài khoản mới
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
                Họ và Tên
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Mật khẩu
              </label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Mã giới thiệu (Nếu có)
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="STUDY_XXXXX"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
