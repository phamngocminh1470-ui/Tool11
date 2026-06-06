"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { 
  CreditCard, CheckCircle, RefreshCw, 
  ShieldAlert, Landmark, QrCode, AlertCircle 
} from "lucide-react";

export default function CheckoutSimulationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updateUser } = useAuth();

  const [gateway, setGateway] = useState("stripe");
  const [tier, setTier] = useState("pro");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const gw = searchParams.get("gateway") || "stripe";
    const t = searchParams.get("tier") || "pro";
    const ord = searchParams.get("order_id") || "ORDER_MOCK";
    const amt = searchParams.get("amount") || "99000";

    setGateway(gw);
    setTier(t);
    setOrderId(ord);
    setAmount(amt);
  }, [searchParams]);

  const handleSimulatePayment = async () => {
    setError(null);
    setProcessing(true);

    try {
      // Trigger callback API to backend which updates database payment status
      await api.triggerPaymentSuccessCallback(orderId);
      
      // Update local context user profile subscription tier
      updateUser({ tier });
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Xử lý cổng thanh toán giả lập thất bại. Thử lại sau.");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val: string) => {
    if (!val) return "";
    if (gateway === "stripe") {
      return `$${val}`;
    }
    return `${Number(val).toLocaleString("vi-VN")} VND`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center px-4 py-8 relative overflow-hidden">
      <div className="glow-spot bg-purple-600/40 top-[-10%] left-[20%]" />
      <div className="glow-spot bg-blue-600/40 bottom-[-10%] right-[20%]" />

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl border border-slate-800 space-y-6">
          
          {/* Header branding */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Giả lập thanh toán</span>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                StudyOS Sandbox
              </h2>
            </div>
            <span className="text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-400 font-bold uppercase">
              {gateway} GATEWAY
            </span>
          </div>

          {/* Error and Success notifications */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-10 space-y-4">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Thanh toán thành công!</h3>
              <p className="text-xs text-slate-400">Tài khoản của bạn đã được nâng cấp lên gói {tier.toUpperCase()}. Đang chuyển hướng về Dashboard...</p>
            </div>
          ) : (
            <>
              {/* Order Info */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Mã đơn hàng (Order ID):</span>
                  <strong className="text-slate-200 font-mono font-bold">{orderId}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gói nâng cấp:</span>
                  <strong className="text-purple-400 font-bold uppercase">StudyOS {tier}</strong>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/40 pt-2 mt-2">
                  <span className="text-slate-300 font-semibold">Tổng thanh toán:</span>
                  <strong className="text-slate-100 font-extrabold text-sm">{formatCurrency(amount)}</strong>
                </div>
              </div>

              {/* Gateway-specific mockup layouts */}
              {gateway === "stripe" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800 flex gap-2 text-xs text-slate-400">
                    <CreditCard className="h-4.5 w-4.5 text-blue-400 flex-shrink-0" />
                    <span>Mô phỏng giao diện Stripe Credit Card. Bạn chỉ cần click nút thanh toán bên dưới.</span>
                  </div>
                  <div className="space-y-3">
                    <input type="text" readOnly placeholder="Cardholder Name: MOCK USER" className="w-full px-3.5 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 text-xs cursor-not-allowed" />
                    <input type="text" readOnly placeholder="Card Number: 4242 •••• •••• 4242" className="w-full px-3.5 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 text-xs cursor-not-allowed" />
                  </div>
                </div>
              )}

              {gateway === "momo" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <QrCode className="h-28 w-28 text-slate-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-300">Quét mã QR MoMo</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Mở ứng dụng Ví MoMo và quét mã QR để thanh toán. Bấm nút phía dưới để kích hoạt kết quả sau khi quét.
                    </p>
                  </div>
                </div>
              )}

              {gateway === "vnpay" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/40 border border-slate-800 flex gap-2 text-xs text-slate-400">
                    <Landmark className="h-4.5 w-4.5 text-amber-400 flex-shrink-0" />
                    <span>Mô phỏng ngân hàng chuyển khoản VNPay. Chọn ngân hàng thanh toán:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400">
                    <div className="p-2.5 bg-slate-900 border border-purple-500/20 rounded-lg text-center cursor-pointer hover:border-purple-500">Vietcombank</div>
                    <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg text-center cursor-pointer hover:border-purple-500">Techcombank</div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="space-y-3 pt-4 border-t border-slate-850">
                <button
                  onClick={handleSimulatePayment}
                  disabled={processing}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang xử lý đơn hàng...
                    </>
                  ) : (
                    "Hoàn thành thanh toán (Simulate Pay)"
                  )}
                </button>

                <button
                  onClick={() => router.push("/billing")}
                  disabled={processing}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 font-semibold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ giao dịch
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
