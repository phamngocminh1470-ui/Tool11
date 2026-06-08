"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { HelpCircle, Mail, ShieldAlert, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSuccess("Yêu cầu gửi thành công! Hãy kiểm tra mã OTP trong hòm thư.");
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Không thể yêu cầu khôi phục mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 auth-page-glow overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎓 StudyOS AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Khôi phục mật khẩu tài khoản học tập
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-400" />
            Quên mật khẩu?
          </h2>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Nhập email của bạn để chúng tôi gửi mã OTP đặt lại mật khẩu mới.
          </p>

          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-lg bg-green-950/20 border border-green-500/30 text-green-300 text-xs flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
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

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Gửi mã OTP"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Nhớ ra mật khẩu?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
