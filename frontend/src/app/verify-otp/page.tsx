"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { KeyRound, ShieldAlert, CheckCircle } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.verifyOtp({ email, otp });
      setSuccess("Kích hoạt tài khoản thành công! Bạn đang được chuyển hướng...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã.");
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
            Xác thực tài khoản của bạn để bắt đầu học tập
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-400" />
            Xác thực mã OTP
          </h2>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Chúng tôi đã gửi mã xác thực gồm 6 chữ số tới địa chỉ email: <strong className="text-slate-300">{email}</strong>.
            Nếu không tìm thấy, vui lòng kiểm tra mục Spam hoặc console logs của backend.
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
                Mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-bold py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-100 focus:outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xác thực..." : "Kích hoạt"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Chưa nhận được mã OTP?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Đang tải...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
