"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, FileText, GitBranch, Layers, 
  HelpCircle, GraduationCap, MessageSquare, ArrowRight 
} from "lucide-react";

export default function LandingPage() {
  const features = [
    { name: "Tóm tắt tài liệu", desc: "Trích xuất ý chính, chia chương học và công thức trong 5 giây.", icon: FileText, color: "text-purple-400" },
    { name: "Sơ đồ kiến thức", desc: "Tự động dựng mindmap và timeline liên kết các chủ đề.", icon: GitBranch, color: "text-blue-400" },
    { name: "Flashcard AI", desc: "Lặp lại ngắt quãng Leitner tối ưu khả năng ghi nhớ dài hạn.", icon: Layers, color: "text-pink-400" },
    { name: "Trắc nghiệm AI", desc: "Sinh bộ câu hỏi phong phú từ trắc nghiệm đến điền khuyết.", icon: HelpCircle, color: "text-amber-400" },
    { name: "Chế độ thi thử", desc: "Thi thử áp suất thời gian thực, chống chuyển tab và chấm điểm.", icon: GraduationCap, color: "text-red-400" },
    { name: "AI Tutor Chat", desc: "Trò chuyện trực tiếp với tài liệu học tập, trích dẫn chuẩn xác.", icon: MessageSquare, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background glow animations */}
      <div className="glow-spot bg-purple-600/35 top-[-10%] left-[10%]" />
      <div className="glow-spot bg-blue-600/35 bottom-[-10%] right-[10%]" />

      {/* Header Bar */}
      <header className="w-full py-6 px-8 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-900 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎓 StudyOS AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-slate-400 hover:text-slate-100 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/register" 
            className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-5xl mx-auto relative z-10 py-16 md:py-24">
        
        {/* Floating AI badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300 mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Học tập 2.0 bằng Trí tuệ nhân tạo</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-none">
          Biến mọi tài liệu học tập thành <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Hệ thống học tập hoàn chỉnh
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Tải tài liệu PDF, DOCX, PPTX hoặc ảnh lên. StudyOS AI sẽ phân tách chi tiết ý chính, sinh Flashcard Leitner, lập bản đồ Mindmap và tổ chức thi thử.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/register"
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group cursor-pointer"
          >
            Trải nghiệm ngay bây giờ
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="py-3 px-8 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Đăng nhập tài khoản
          </Link>
        </div>

        {/* Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 border-t border-slate-900 pt-16">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel border border-slate-850 p-6 rounded-2xl flex flex-col items-center text-center shadow-lg hover:border-purple-500/20 hover:bg-slate-900/30 transition-all"
              >
                <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${feat.color}`} />
                </div>
                <h3 className="font-bold text-slate-200 text-sm">{feat.name}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[240px] font-medium">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer footer */}
      <footer className="py-8 text-center text-xs text-slate-600 border-t border-slate-900 relative z-10">
        <p>© 2026 StudyOS AI SaaS Platform. Thiết kế và tối ưu bởi Senior Full Stack Engineer.</p>
      </footer>
    </div>
  );
}
