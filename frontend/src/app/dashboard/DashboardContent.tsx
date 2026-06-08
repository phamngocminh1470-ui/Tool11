"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  FileText, ListCollapse, GraduationCap, Flame, 
  Hourglass, CheckCircle2, TrendingUp, Sparkles, RefreshCw 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from "recharts";

interface Stats {
  total_documents: number;
  total_subjects: number;
  total_questions: number;
  total_flashcards: number;
  total_study_hours: number;
  completion_rate: number;
  average_score: number;
}

interface ChartData {
  learning_progress: any[];
  scores: any[];
  frequency: any[];
}

export default function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(false);
    try {
      setLoading(true);
      const statsData = await api.getDashboardStats();
      const chartsData = await api.getDashboardCharts();
      setStats(statsData);
      setCharts(chartsData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Tài liệu", value: stats?.total_documents || 0, icon: FileText, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { title: "Chủ đề học", value: stats?.total_subjects || 0, icon: ListCollapse, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { title: "Câu hỏi AI", value: stats?.total_questions || 0, icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { title: "Flashcard", value: stats?.total_flashcards || 0, icon: Sparkles, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
    { title: "Giờ đã học", value: `${stats?.total_study_hours || 0}h`, icon: Hourglass, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { title: "Tỉ lệ xong", value: `${stats?.completion_rate || 0}%`, icon: CheckCircle2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { title: "Điểm TB", value: `${stats?.average_score || 0}/100`, icon: GraduationCap, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  ];

  const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Upper Header info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              Chào mừng quay lại, {user?.full_name}! 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Hôm nay chúng ta sẽ tìm hiểu và chinh phục kiến thức mới nào?
            </p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel rounded-xl p-4 flex flex-col justify-between shadow-lg relative group transition-all duration-300 hover:translate-y-[-2px] border border-slate-800/80 hover:border-slate-700/50"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                  <div className={`p-1.5 rounded-lg ${card.color.split(" ")[1]} ${card.color.split(" ")[2]} flex items-center justify-center`}>
                    <Icon className={`h-4.5 w-4.5 ${card.color.split(" ")[0]}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-100">{loading ? "..." : card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center h-80">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Chart: Study Hours */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-200">Tiến độ học tập</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Thời lượng học tập hàng ngày (giờ)</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex items-center gap-1.5 text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +15% tuần này
                </div>
              </div>
              <div className="w-full h-[400px] relative">
                {mounted && charts?.learning_progress && charts.learning_progress.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={charts.learning_progress}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                      />
                      <Area type="monotone" dataKey="hours" name="Số giờ học" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">Chưa có đủ dữ liệu tiến độ. Hãy ôn tập ngay.</div>
                )}
              </div>
            </div>

            {/* Right Chart: Subject Frequency Distribution */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-slate-200">Phân bố chủ đề</h3>
                <p className="text-xs text-slate-400 mt-0.5">Số lượng học liệu theo từng chủ đề</p>
              </div>
              <div className="w-full h-[400px] my-4 relative">
                {mounted && charts?.frequency && charts.frequency.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={charts.frequency}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="subject"
                      >
                        {charts.frequency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-500 text-sm">Chưa có thông tin chủ đề.</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {charts?.frequency?.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold bg-slate-900 border border-slate-800 rounded-full py-1 px-2.5 text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                    <span>{entry.subject} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Chart: Score Progress */}
            <div className="lg:col-span-3 glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-slate-200">Phổ điểm số</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kết quả làm bài thi thử gần đây (%)</p>
              </div>
              <div className="w-full h-[400px] mt-6 relative">
                {mounted && charts?.scores && charts.scores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={charts.scores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                      <XAxis dataKey="exam_name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                      />
                      <Bar dataKey="score" name="Điểm thi thử" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {charts.scores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.score >= 80 ? "#10b981" : entry.score >= 50 ? "#3b82f6" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">Chưa thực hiện bài kiểm tra nào. Vào tab Thi thử để tham gia!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
