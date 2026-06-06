"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert, Users, FileText, Cpu, 
  CreditCard, RefreshCw, CheckCircle2, ShieldCheck 
} from "lucide-react";

interface AdminStats {
  total_users: number;
  total_documents: number;
  ai_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    estimated_cost_usd: number;
  };
  revenue: {
    total_revenue_vnd: number;
  };
  tiers: {
    free: number;
    pro: number;
    premium: number;
  };
}

interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  role: string;
  tier: string;
  is_verified: boolean;
  created_at: string;
}

interface SystemLog {
  id: number;
  user_email: string | null;
  action: string;
  details: string;
  ip_address: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsData = await api.adminGetStats();
      const usersList = await api.adminGetUsers();
      const logsList = await api.adminGetLogs();
      
      setStats(statsData);
      setUsers(usersList);
      setLogs(logsList);
    } catch (err) {
      console.error("Failed to load admin panel data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: number, field: "role" | "tier" | "is_verified", value: any) => {
    try {
      const updated = await api.adminUpdateUser(userId, { [field]: value });
      
      // Update state local list
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (err) {
      alert("Không thể cập nhật người dùng này");
    }
  };

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="h-[70vh] flex flex-col justify-center items-center text-center max-w-sm mx-auto space-y-4">
          <div className="h-14 w-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-md">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">Quyền truy cập bị từ chối!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn không có đặc quyền quản trị. Trang này chỉ khả dụng cho các quản trị viên hệ thống của StudyOS.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header */}
        <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-red-500" />
              Hệ thống Quản Trị (Admin Panel)
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Xem báo cáo doanh thu, lượng dùng token AI, quản lý người dùng và audit logs của toàn hệ thống.
            </p>
          </div>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới hệ thống
          </button>
        </div>

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Stats analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-850 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Người dùng</span>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">{stats?.total_users}</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-850 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tài liệu</span>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">{stats?.total_documents}</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-850 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tổng doanh thu</span>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">
                    {stats?.revenue.total_revenue_vnd.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-850 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Chi phí AI ước tính</span>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">${stats?.ai_usage.estimated_cost_usd.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Sub-panel tabs switcher */}
            <div className="flex border-b border-slate-800 bg-slate-900/20 p-1 rounded-xl max-w-sm w-full border border-slate-900">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                  activeTab === "users"
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tài khoản ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                  activeTab === "logs"
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Nhật ký hệ thống ({logs.length})
              </button>
            </div>

            {/* TAB CONTENT: User lists management */}
            {activeTab === "users" && (
              <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-850 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="py-3 px-4">Họ tên</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Vai trò (Role)</th>
                        <th className="py-3 px-4">Gói cước (Tier)</th>
                        <th className="py-3 px-4">Kích hoạt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/30 text-xs">
                      {users.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 text-slate-300 font-medium">{item.full_name}</td>
                          <td className="py-3 px-4 text-slate-450 font-mono">{item.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={item.role}
                              onChange={(e) => handleUpdateUser(item.id, "role", e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={item.tier}
                              onChange={(e) => handleUpdateUser(item.id, "tier", e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none uppercase font-bold"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleUpdateUser(item.id, "is_verified", !item.is_verified)}
                              className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] cursor-pointer border transition-colors ${
                                item.is_verified
                                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}
                            >
                              {item.is_verified ? "Active" : "Locked"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: System audit logs */}
            {activeTab === "logs" && (
              <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-850">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-purple-500/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 uppercase text-[9px] tracking-wide">
                            {log.action}
                          </span>
                          {log.user_email && (
                            <span className="text-[10px] text-purple-400 font-mono font-medium">({log.user_email})</span>
                          )}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium">{log.details}</p>
                      </div>

                      <div className="text-[10px] text-slate-500 flex flex-col sm:items-end gap-1 font-semibold flex-shrink-0">
                        <span>{new Date(log.created_at).toLocaleString("vi-VN")}</span>
                        {log.ip_address && (
                          <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850/60">
                            IP: {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">Không có log ghi chép nào.</div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  );
}
