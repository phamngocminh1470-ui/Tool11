"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert, Users, FileText, Cpu, 
  CreditCard, RefreshCw, ShieldCheck,
  BookOpen, BarChart2, Settings2, Search,
  UserCheck, Lock, Activity
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

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

interface DocumentRecord {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "courses" | "logs">("users");
  const [mounted, setMounted] = useState(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userTierFilter, setUserTierFilter] = useState("all");

  const [docSearch, setDocSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    setMounted(true);
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
      const documentsList = await api.adminGetDocuments();
      
      setStats(statsData);
      setUsers(usersList);
      setLogs(logsList);
      setDocuments(documentsList);
    } catch (err) {
      console.warn("Failed to load admin panel data, using mock fallback data", err);
      // Fallback/dummy data to comply with "render dữ liệu giả định nếu chưa có DB"
      setStats({
        total_users: 148,
        total_documents: 42,
        ai_usage: {
          prompt_tokens: 320000,
          completion_tokens: 180000,
          estimated_cost_usd: 12.45
        },
        revenue: {
          total_revenue_vnd: 25990000
        },
        tiers: {
          free: 112,
          pro: 28,
          premium: 8
        }
      });
      setUsers([
        { id: 1, email: "phamngocminh1470@gmail.com", full_name: "TUAN ANH STUDIO (Tester)", role: "user", tier: "premium", is_verified: true, created_at: new Date().toISOString() },
        { id: 2, email: "admin@studyos.ai", full_name: "Quản trị viên", role: "admin", tier: "premium", is_verified: true, created_at: new Date().toISOString() },
        { id: 3, email: "nguyenvana@gmail.com", full_name: "Nguyễn Văn A", role: "user", tier: "free", is_verified: true, created_at: new Date().toISOString() },
        { id: 4, email: "tranb@gmail.com", full_name: "Trần Thị B", role: "user", tier: "pro", is_verified: false, created_at: new Date().toISOString() },
        { id: 5, email: "lecuong@gmail.com", full_name: "Lê Văn Cường", role: "user", tier: "free", is_verified: true, created_at: new Date().toISOString() }
      ]);
      setLogs([
        { id: 1, user_email: "phamngocminh1470@gmail.com", action: "Register", details: "Đăng ký thành viên mới phamngocminh1470@gmail.com", ip_address: "127.0.0.1", created_at: new Date().toISOString() },
        { id: 2, user_email: "admin@studyos.ai", action: "Admin Update User", details: "Cập nhật quyền tài khoản ID 3", ip_address: "127.0.0.1", created_at: new Date().toISOString() }
      ]);
      setDocuments([
        { id: 1, name: "GiaoTrinhMarketing.pdf", size: 1254300, mime_type: "application/pdf", file_url: "", created_at: new Date().toISOString() },
        { id: 2, name: "Code_QuickSort.py", size: 3400, mime_type: "text/x-python", file_url: "", created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: number, field: "role" | "tier" | "is_verified", value: any) => {
    try {
      await api.adminUpdateUser(userId, { [field]: value });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (err) {
      alert("Không thể cập nhật thông tin người dùng. Cập nhật offline trên Client.");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    }
  };

  // Processing data for Subject / Course distribution
  const getSubjectDistribution = () => {
    if (!documents || documents.length === 0) {
      return [
        { name: "Kinh doanh & Marketing", value: 4 },
        { name: "Khoa học Máy tính", value: 6 },
        { name: "Toán học & Thống kê", value: 3 },
        { name: "Ngoại ngữ", value: 5 },
        { name: "Học thuật chung", value: 4 }
      ];
    }

    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      const name = doc.name.toLowerCase();
      let subject = "Khác";
      if (name.includes("marketing") || name.includes("pr") || name.includes("kinh doanh") || name.includes("business") || name.includes("sales")) {
        subject = "Kinh doanh & Marketing";
      } else if (name.includes("code") || name.includes("programming") || name.includes("python") || name.includes("javascript") || name.includes("html") || name.includes("css") || name.includes("java") || name.includes("c++") || name.includes("web") || name.includes("tin hoc")) {
        subject = "Khoa học Máy tính";
      } else if (name.includes("toan") || name.includes("math") || name.includes("algebra") || name.includes("calculus") || name.includes("thong ke") || name.includes("statistic")) {
        subject = "Toán & Thống kê";
      } else if (name.includes("english") || name.includes("tieng anh") || name.includes("ielts") || name.includes("toeic") || name.includes("japanese") || name.includes("tieng nhat")) {
        subject = "Ngoại ngữ";
      } else if (name.includes("giao trinh") || name.includes("sach") || name.includes("book") || name.includes("de thi") || name.includes("quiz") || name.includes("exam")) {
        subject = "Học thuật chung";
      }
      counts[subject] = (counts[subject] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Processing data for file type distribution
  const getMimeTypeDistribution = () => {
    if (!documents || documents.length === 0) {
      return [
        { name: "PDF", value: 8 },
        { name: "Word (DOCX)", value: 5 },
        { name: "PowerPoint", value: 3 },
        { name: "Văn bản (TXT)", value: 4 }
      ];
    }

    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      let type = "Khác";
      if (doc.mime_type.toLowerCase().includes("pdf")) {
        type = "PDF";
      } else if (doc.mime_type.toLowerCase().includes("word") || doc.mime_type.toLowerCase().includes("document") || doc.name.endsWith(".docx") || doc.name.endsWith(".doc")) {
        type = "Word (DOCX)";
      } else if (doc.mime_type.toLowerCase().includes("presentation") || doc.mime_type.toLowerCase().includes("powerpoint") || doc.name.endsWith(".pptx") || doc.name.endsWith(".ppt")) {
        type = "PowerPoint";
      } else if (doc.mime_type.toLowerCase().includes("text") || doc.name.endsWith(".txt")) {
        type = "Văn bản (TXT)";
      } else if (doc.mime_type.toLowerCase().includes("image") || doc.name.endsWith(".png") || doc.name.endsWith(".jpg") || doc.name.endsWith(".jpeg")) {
        type = "Hình ảnh";
      }
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Filters logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "all" ? true : u.role === userRoleFilter;
    const matchesTier = userTierFilter === "all" ? true : u.tier === userTierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(docSearch.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.user_email && l.user_email.toLowerCase().includes(logSearch.toLowerCase()))
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const COLORS = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="h-[70vh] flex flex-col justify-center items-center text-center max-w-sm mx-auto space-y-4">
          <div className="h-14 w-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-md">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">Quyền truy cập bị từ chối!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn không có đặc quyền quản trị. Trang này chỉ khả dụng cho các quản trị viên hệ thống của TUAN ANH STUDIO.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2 bg-gradient-to-r from-slate-100 via-purple-300 to-slate-200 bg-clip-text text-transparent">
              <ShieldCheck className="h-8 w-8 text-purple-400" />
              TUAN ANH STUDIO - Admin Panel
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Hệ thống quản trị doanh thu, học liệu, học viên, và nhật ký hoạt động hệ thống.
            </p>
          </div>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/50 hover:bg-slate-900/80 text-sm font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới hệ thống
          </button>
        </div>

        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 text-purple-500 animate-spin" />
            <p className="text-xs text-slate-500 animate-pulse font-medium">Đang đồng bộ dữ liệu hệ thống...</p>
          </div>
        ) : (
          <div className="space-y-8 z-10">
            
            {/* Stats analytics Cards (Tổng doanh thu, Tổng học viên, Trạng thái hệ thống) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Doanh thu */}
              <div className="glass-panel rounded-2xl p-6 shadow-lg border border-slate-800/80 bg-slate-900/30 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng doanh thu</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {(stats?.revenue.total_revenue_vnd || 0).toLocaleString("vi-VN")} <span className="text-xs font-bold">VND</span>
                  </p>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Từ giao dịch nâng cấp tài khoản</span>
                </div>
              </div>

              {/* Tổng học viên */}
              <div className="glass-panel rounded-2xl p-6 shadow-lg border border-slate-800/80 bg-slate-900/30 flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng học viên</span>
                  <p className="text-2xl font-black text-slate-100 mt-1">{stats?.total_users || 0}</p>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Học viên đăng ký trên hệ thống</span>
                </div>
              </div>

              {/* Trạng thái hệ thống */}
              <div className="glass-panel rounded-2xl p-6 shadow-lg border border-slate-800/80 bg-slate-900/30 flex items-center gap-4 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trạng thái hệ thống</span>
                  <p className="text-2xl font-black text-blue-450 text-blue-400 mt-1 flex items-center gap-2">
                    Online
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  </p>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Hoạt động ổn định (99.9% Uptime)</span>
                </div>
              </div>
            </div>

            {/* Split Sidebar & Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1 glass-panel rounded-2xl p-4 border border-slate-800/80 bg-slate-900/30 flex flex-col gap-1.5">
                <span className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Menu quản trị</span>
                
                {/* Quản lý học viên */}
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "users"
                      ? "bg-purple-600/15 border border-purple-500/20 text-purple-300 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                  }`}
                >
                  <Users className={`h-4.5 w-4.5 ${activeTab === "users" ? "text-purple-400" : "text-slate-500"}`} />
                  <span>Quản lý học viên</span>
                  <span className="ml-auto text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full px-2 py-0.5 font-bold">
                    {users.length}
                  </span>
                </button>

                {/* Quản lý khóa học */}
                <button
                  onClick={() => setActiveTab("courses")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "courses"
                      ? "bg-purple-600/15 border border-purple-500/20 text-purple-300 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                  }`}
                >
                  <BarChart2 className={`h-4.5 w-4.5 ${activeTab === "courses" ? "text-purple-400" : "text-slate-500"}`} />
                  <span>Quản lý khóa học</span>
                  <span className="ml-auto text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 font-bold">
                    {documents.length}
                  </span>
                </button>

                {/* Cấu hình hệ thống */}
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "logs"
                      ? "bg-purple-600/15 border border-purple-500/20 text-purple-300 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                  }`}
                >
                  <Settings2 className={`h-4.5 w-4.5 ${activeTab === "logs" ? "text-purple-400" : "text-slate-500"}`} />
                  <span>Cấu hình hệ thống</span>
                  <span className="ml-auto text-[10px] bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-full px-2 py-0.5 font-bold">
                    {logs.length}
                  </span>
                </button>
              </div>

              {/* Main Content Panel */}
              <div className="lg:col-span-3">
                
                {/* TAB CONTENT: Quản lý học viên */}
                {activeTab === "users" && (
                  <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 bg-slate-900/20 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-400" />
                          Danh sách học viên
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Phân quyền, nâng cấp gói cước và thay đổi trạng thái kích hoạt tài khoản.</p>
                      </div>

                      {/* Filters and search */}
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Search input */}
                        <div className="relative flex-1 md:w-60">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-505 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Tìm học viên..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-xs focus:outline-none transition-all placeholder:text-slate-600"
                          />
                        </div>

                        {/* Role filter */}
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none font-semibold cursor-pointer"
                        >
                          <option value="all">Tất cả vai trò</option>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Tier filter */}
                        <select
                          value={userTierFilter}
                          onChange={(e) => setUserTierFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none font-semibold cursor-pointer"
                        >
                          <option value="all">Tất cả gói</option>
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-850/60 rounded-xl bg-slate-900/10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-900/50">
                            <th className="py-3.5 px-4">Thông tin học viên</th>
                            <th className="py-3.5 px-4">Vai trò (Role)</th>
                            <th className="py-3.5 px-4">Gói cước (Tier)</th>
                            <th className="py-3.5 px-4 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/30 text-xs">
                          {filteredUsers.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                              <td className="py-4 px-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
                                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.email}`} alt={item.full_name} className="h-full w-full" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-slate-200 font-semibold">{item.full_name || "Chưa đặt tên"}</span>
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{item.email}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <select
                                  value={item.role}
                                  onChange={(e) => handleUpdateUser(item.id, "role", e.target.value)}
                                  className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer focus:border-purple-500/50"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="py-4 px-4">
                                <select
                                  value={item.tier}
                                  onChange={(e) => handleUpdateUser(item.id, "tier", e.target.value)}
                                  className={`bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 text-xs focus:outline-none cursor-pointer font-bold focus:border-purple-500/50 ${
                                    item.tier === "premium" ? "text-purple-400" : item.tier === "pro" ? "text-blue-400" : "text-slate-400"
                                  }`}
                                >
                                  <option value="free">FREE</option>
                                  <option value="pro">PRO</option>
                                  <option value="premium">PREMIUM</option>
                                </select>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  onClick={() => handleUpdateUser(item.id, "is_verified", !item.is_verified)}
                                  className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer border transition-all duration-300 flex items-center gap-1.5 mx-auto ${
                                    item.is_verified
                                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                                      : "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20"
                                  }`}
                                >
                                  {item.is_verified ? (
                                    <>
                                      <UserCheck className="h-3 w-3" />
                                      <span>Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      <span>Locked</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                          
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-10 text-slate-500 text-xs font-semibold">
                                Không tìm thấy học viên nào khớp bộ lọc.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Quản lý khóa học */}
                {activeTab === "courses" && (
                  <div className="space-y-6">
                    {/* Charts grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Topic Distribution Pie Chart */}
                      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 bg-slate-900/20 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-200 text-sm">Phân bố chủ đề khóa học</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Số lượng tài liệu học tập theo phân vùng chủ đề AI tự động bóc tách.</p>
                        </div>
                        
                        <div className="w-full h-[240px] my-6 relative">
                          {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getSubjectDistribution()}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {getSubjectDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">Chưa sẵn sàng tải biểu đồ.</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                          {getSubjectDistribution().map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold bg-slate-900 border border-slate-800 rounded-full py-1 px-2.5 text-slate-400">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                              <span>{entry.name} ({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* File format bar chart */}
                      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 bg-slate-900/20 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-200 text-sm">Định dạng tài liệu</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Tỉ lệ lưu trữ và định dạng dữ liệu đầu vào.</p>
                        </div>

                        <div className="w-full h-[240px] my-6 relative">
                          {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getMimeTypeDistribution()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                                <YAxis stroke="#64748b" fontSize={9} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "11px" }}
                                />
                                <Bar dataKey="value" name="Số tài liệu" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                  {getMimeTypeDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">Chưa sẵn sàng tải biểu đồ.</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                          {getMimeTypeDistribution().map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold bg-slate-900 border border-slate-800 rounded-full py-1 px-2.5 text-slate-450">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }}></span>
                              <span>{entry.name} ({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* System Documents List */}
                    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 bg-slate-900/20 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-slate-200 flex items-center gap-2 text-base">
                            <BookOpen className="h-5 w-5 text-purple-400" />
                            Kho học liệu của hệ thống
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Tất cả tệp tin giáo trình, đề thi do học viên tải lên server.</p>
                        </div>
                        <div className="relative w-full sm:w-60">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Tìm tài liệu..."
                            value={docSearch}
                            onChange={(e) => setDocSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-xs focus:outline-none transition-all placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-850/60 rounded-xl bg-slate-900/10">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-900/50">
                              <th className="py-3.5 px-4">Tên tài liệu</th>
                              <th className="py-3.5 px-4">Kích thước</th>
                              <th className="py-3.5 px-4">Mime Type</th>
                              <th className="py-3.5 px-4">Ngày tải lên</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/30 text-xs">
                            {filteredDocs.map((doc) => (
                              <tr key={doc.id} className="hover:bg-slate-900/30 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-slate-200 max-w-xs truncate" title={doc.name}>
                                  {doc.name}
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 font-mono">
                                  {formatBytes(doc.size)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    {doc.mime_type.split("/")[1] || doc.mime_type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 font-mono">
                                  {new Date(doc.created_at).toLocaleDateString("vi-VN", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                              </tr>
                            ))}

                            {filteredDocs.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-10 text-slate-500 text-xs font-semibold">
                                  Chưa có tài liệu nào trong kho lưu trữ.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Nhật ký hệ thống */}
                {activeTab === "logs" && (
                  <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 bg-slate-900/20 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                          <Settings2 className="h-5 w-5 text-purple-400" />
                          Nhật ký hệ thống (Audit Logs)
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Giám sát và ghi nhận toàn bộ hoạt động bảo mật, tương tác API.</p>
                      </div>
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Lọc hành động, email, IP..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-xs focus:outline-none transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                      {filteredLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className="p-4 bg-slate-900/60 border border-slate-800/65 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-purple-500/20 hover:bg-slate-900/80 transition-all duration-300"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 uppercase text-[9px] tracking-wide">
                                {log.action}
                              </span>
                              {log.user_email && (
                                <span className="text-[10px] text-purple-400 font-mono font-medium">({log.user_email})</span>
                              )}
                            </div>
                            <p className="text-slate-300 leading-relaxed font-medium">{log.details}</p>
                          </div>

                          <div className="text-[10px] text-slate-500 flex flex-col sm:items-end gap-1.5 font-semibold flex-shrink-0">
                            <span>{new Date(log.created_at).toLocaleString("vi-VN")}</span>
                            {log.ip_address && (
                              <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850/60 text-[9px]">
                                IP: {log.ip_address}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {filteredLogs.length === 0 && (
                        <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                          Không tìm thấy nhật ký hoạt động nào phù hợp.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>

            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
