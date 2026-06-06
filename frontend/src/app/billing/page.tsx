"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Check, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";

export default function BillingPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [gateway, setGateway] = useState<Record<string, string>>({
    pro: "stripe",
    premium: "momo"
  });
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (tier: string) => {
    setError(null);
    setLoading(tier);
    const selectedGateway = gateway[tier] || "stripe";

    try {
      const response = await api.checkout({
        tier,
        gateway: selectedGateway
      });
      
      // Redirect to the mock sandbox checkout simulation url
      window.location.href = response.payment_url;
    } catch (err: any) {
      setError(err.message || "Tạo hóa đơn thanh toán thất bại");
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "0 VND",
      desc: "Trải nghiệm học tập cơ bản bằng AI",
      features: [
        "Upload tối đa 3 tài liệu",
        "Kích thước file tối đa 5MB",
        "Tóm tắt tài liệu cơ bản",
        "Tạo 10 flashcards và 5 câu hỏi",
        "Hỗ trợ AI Tutor Chat giới hạn"
      ],
      cta: "Đang sử dụng",
      enabled: false,
      color: "border-slate-800"
    },
    {
      id: "pro",
      name: "Pro",
      price: "99,000 VND",
      period: "/ tháng",
      desc: "Phù hợp cho học sinh, sinh viên học thi",
      features: [
        "Upload không giới hạn tài liệu",
        "Dung lượng tệp lên tới 20MB",
        "Tóm tắt chi tiết, chia chương học",
        "Tạo Mindmap và Timeline không giới hạn",
        "Truy cập đầy đủ AI Flashcards & Leitner",
        "AI Quiz đầy đủ mọi mức độ độ khó",
        "Chế độ thi thử Exam Mode đầy đủ",
        "Affiliate giới thiệu bạn bè nhận hoa hồng 20%"
      ],
      cta: "Nâng cấp Pro",
      enabled: true,
      color: "border-purple-500 bg-purple-500/5 shadow-purple-950/20"
    },
    {
      id: "premium",
      name: "Premium",
      price: "199,000 VND",
      period: "/ tháng",
      desc: "Học tập chuyên sâu, làm tiểu luận khoa học",
      features: [
        "Mọi tính năng của gói Pro",
        "Ưu tiên xử lý tài liệu tốc độ cao",
        "Không giới hạn token AI Tutor",
        "Tải xuống PDF/Word tóm tắt học liệu",
        "Hỗ trợ kỹ thuật 24/7 trực tiếp",
        "Rút tiền affiliate nhanh chóng trong 2h"
      ],
      cta: "Nâng cấp Premium",
      enabled: true,
      color: "border-blue-500 bg-blue-500/5 shadow-blue-950/20"
    }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header */}
        <div className="border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-purple-400" />
            Nâng cấp gói dịch vụ StudyOS
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Mở khóa toàn bộ sức mạnh AI để đột phá kết quả học tập của bạn ngay hôm nay.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const isCurrentTier = user?.tier === tier.id;
            const canUpgrade = tier.enabled && !isCurrentTier;
            
            return (
              <div 
                key={tier.id}
                className={`glass-panel border rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-xl relative ${tier.color}`}
              >
                {/* Popular Badge */}
                {tier.id === "pro" && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Yêu thích
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-200">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-3xl font-extrabold text-slate-100">{tier.price}</span>
                    {tier.period && <span className="text-xs text-slate-500 font-semibold">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tier.desc}</p>
                  
                  {/* Features List */}
                  <ul className="space-y-3 mt-6 border-t border-slate-900 pt-6">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex gap-2 text-xs text-slate-300 font-medium">
                        <Check className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-900/60">
                  {/* Gateway selector for payable packages */}
                  {canUpgrade && (
                    <div className="mb-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Chọn cổng thanh toán</label>
                      <select 
                        value={gateway[tier.id]}
                        onChange={(e) => setGateway(prev => ({ ...prev, [tier.id]: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none transition-colors"
                      >
                        <option value="momo">Ví điện tử MoMo</option>
                        <option value="vnpay">Cổng VNPay</option>
                        <option value="stripe">Thẻ Quốc Tế Stripe</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => handleCheckout(tier.id)}
                    disabled={!canUpgrade || loading === tier.id}
                    className={`w-full py-3 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrentTier
                        ? "bg-slate-900 border border-slate-800 text-slate-400 cursor-not-allowed"
                        : canUpgrade
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/10"
                        : "bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    {loading === tier.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : isCurrentTier ? (
                      "Gói hiện tại của bạn"
                    ) : (
                      tier.cta
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
