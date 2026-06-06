"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { 
  Users, Copy, Check, ShieldCheck, 
  HelpCircle, RefreshCw, Landmark, ArrowRight 
} from "lucide-react";

interface AffiliateStats {
  referral_code: string;
  total_referred: number;
  total_earnings: number;
  current_balance: number;
  referrals: Array<{
    email: string;
    full_name: string;
    tier: string;
    joined_at: string;
  }>;
}

export default function AffiliatePage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAffiliateStats();
  }, []);

  const fetchAffiliateStats = async () => {
    setLoading(true);
    try {
      const res = await api.getAffiliateStats();
      setStats(res);
    } catch (err) {
      console.error("Failed to load affiliate stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!stats) return;
    const link = `${window.location.origin}/register?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawal = async () => {
    if (!stats || withdrawing) return;
    setMessage(null);
    setWithdrawing(true);

    try {
      const response = await api.requestWithdrawal();
      setMessage({ type: "success", text: response.message });
      // Reload stats to refresh balance
      await fetchAffiliateStats();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Yêu cầu rút tiền thất bại" });
    } finally {
      setWithdrawing(false);
    }
  };

  const referralUrl = stats ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${stats.referral_code}` : "";

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header */}
        <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-400" />
              Chương trình Tiếp thị Liên kết (Affiliate)
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Chia sẻ StudyOS AI với bạn bè để nhận hoa hồng 20% trên mỗi hóa đơn nâng cấp Pro/Premium.
            </p>
          </div>
          <button
            onClick={fetchAffiliateStats}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Message Prompt */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-3 border ${
            message.type === "success" 
              ? "bg-green-950/20 border-green-500/30 text-green-300"
              : "bg-red-950/20 border-red-500/30 text-red-300"
          }`}>
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : !stats ? (
          <div className="text-slate-500 text-center py-20">Không thể tải thông tin liên kết.</div>
        ) : (
          <div className="space-y-6">
            
            {/* Link Copy Widget */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-850 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đường dẫn giới thiệu của bạn</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none select-all font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4.5 w-4.5 text-emerald-400" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4.5 w-4.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Commissions Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Người đã giới thiệu</span>
                  <p className="text-3xl font-extrabold text-slate-100 mt-2">{stats.total_referred} thành viên</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">Đăng ký tài khoản qua đường dẫn giới thiệu của bạn</p>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng hoa hồng tích lũy</span>
                  <p className="text-3xl font-extrabold text-purple-400 mt-2">
                    {stats.total_earnings.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">Hoa hồng 20% trích xuất từ các lượt thanh toán thành công</p>
              </div>

              {/* withdrawable balance */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl border-l-4 border-l-purple-500">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Số dư hiện tại</span>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-2">
                    {stats.current_balance.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                
                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawing || stats.current_balance < 50000}
                  className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Landmark className="h-4 w-4" />
                  Rút tiền (Tối thiểu 50k)
                </button>
              </div>
            </div>

            {/* Referrals table list */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-850">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-purple-400" />
                Danh sách người dùng đã giới thiệu
              </h3>

              {stats.referrals.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <span>Chưa có ai đăng ký qua đường dẫn giới thiệu của bạn.</span>
                  <span className="mt-1 text-slate-600">Hãy chia sẻ đường dẫn để bắt đầu kiếm hoa hồng!</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="py-3 px-4">Tên</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Gói cước</th>
                        <th className="py-3 px-4">Ngày đăng ký</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-xs">
                      {stats.referrals.map((ref, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 text-slate-350 font-medium">{ref.full_name}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">{ref.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider ${
                              ref.tier === "premium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : ref.tier === "pro"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {ref.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(ref.joined_at).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
