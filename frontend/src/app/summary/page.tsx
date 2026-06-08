"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  FileText, List, Sparkles, BookOpen, 
  ChevronRight, RefreshCw, Key, Sigma, Quote 
} from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  content_summary: string;
  key_points: string[];
  formulas: string[];
  keywords: string[];
  order: number;
}

interface SummaryData {
  short_summary: string;
  detailed_summary: string;
  bullet_points: string[];
  chapters: Chapter[];
}

export default function SummaryPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "chapters">("overview");
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (selectedDocId) {
      loadSummary(selectedDocId);
    }
  }, [selectedDocId]);

  const loadSummary = async (docId: number) => {
    setLoading(true);
    setSummary(null);
    try {
      const data = await api.getSummary(docId);
      setSummary(data);
      // Auto expand first chapter
      if (data.chapters && data.chapters.length > 0) {
        setOpenChapters({ [data.chapters[0].id]: true });
      }
    } catch (err) {
      console.error("Failed to load summary", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  const toggleChapter = (chId: number) => {
    setOpenChapters(prev => ({ ...prev, [chId]: !prev[chId] }));
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header + Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-400" />
              Tóm tắt tài liệu bằng AI
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Xem tóm tắt rút gọn, chi tiết và phân loại thông tin theo từng chương học.
            </p>
          </div>
          <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
        </div>

        {/* Loading / Empty / Loaded States */}
        {!selectedDocId ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-purple-500/50 mb-3 animate-pulse" />
            <span>Vui lòng chọn tài liệu ở góc trên bên phải để xem tóm tắt</span>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            {/* Tabs skeleton */}
            <div className="h-10 w-full max-w-md bg-slate-900/60 rounded-xl border border-slate-850" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left pane skeleton */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-850/80 flex flex-col gap-4">
                <div className="h-4 w-48 bg-slate-800 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/70 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/70 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/70 rounded-md" />
                <div className="h-3.5 w-3/4 bg-slate-800/70 rounded-md" />
              </div>
              
              {/* Right pane skeleton */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-850/80 flex flex-col gap-4">
                <div className="h-4 w-32 bg-slate-800 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/50 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/50 rounded-md" />
                <div className="h-3.5 w-full bg-slate-800/50 rounded-md" />
              </div>
            </div>
          </div>
        ) : !summary ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <RefreshCw className="h-8 w-8 text-purple-500/50 mb-3 animate-spin" />
            <span className="text-center max-w-sm text-xs leading-relaxed px-4">
              Học liệu đang được AI phân tích ngầm ở lần đầu tải lên. Quá trình này mất khoảng 5-10 giây. Hãy tải lại trang.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800 bg-slate-900/20 p-1 rounded-xl max-w-md w-full">
              {(["overview", "detailed", "chapters"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    activeTab === tab
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "overview" && "Tóm tắt ngắn"}
                  {tab === "detailed" && "Tóm tắt chi tiết"}
                  {tab === "chapters" && "Chia chương học"}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Quote className="h-4 w-4 text-purple-400" />
                      Tổng quan tài liệu
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {summary.short_summary}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <List className="h-4 w-4 text-blue-400" />
                    Ý chính cốt lõi
                  </h3>
                  <ul className="space-y-3">
                    {summary.bullet_points.map((pt, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed font-medium">
                        <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Detailed Summary */}
            {activeTab === "detailed" && (
              <div className="glass-panel rounded-2xl p-8 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  Nội dung chi tiết
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-line font-medium">
                  {summary.detailed_summary}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Chapters breakdown */}
            {activeTab === "chapters" && (
              <div className="space-y-4">
                {summary.chapters.map((ch, idx) => {
                  const isOpen = openChapters[ch.id];
                  return (
                    <div 
                      key={ch.id} 
                      className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 shadow-md"
                    >
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(ch.id)}
                        className="w-full py-4 px-6 bg-slate-900/40 hover:bg-slate-900/80 flex items-center justify-between text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-purple-600/20 text-purple-400 py-1 px-2.5 rounded-md font-bold">
                            Chương {idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-200 text-sm">{ch.title}</h4>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>

                      {/* Chapter details */}
                      {isOpen && (
                        <div className="p-6 border-t border-slate-850 space-y-6 bg-slate-950/20">
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tóm tắt chương</h5>
                            <p className="text-slate-300 text-sm leading-relaxed font-medium">{ch.content_summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Key points */}
                            <div className="md:col-span-2 space-y-2">
                              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nội dung cốt lõi</h5>
                              <ul className="space-y-2">
                                {ch.key_points.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex gap-2 text-xs text-slate-300 leading-relaxed font-medium">
                                    <span className="text-purple-400 font-bold">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Keywords and formulas */}
                            <div className="space-y-4">
                              {/* Formulas */}
                              {ch.formulas && ch.formulas.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Sigma className="h-3.5 w-3.5 text-blue-400" />
                                    Công thức
                                  </h5>
                                  <div className="flex flex-col gap-1.5">
                                    {ch.formulas.map((f, fIdx) => (
                                      <code key={fIdx} className="bg-slate-900/80 px-2 py-1.5 rounded border border-slate-800 text-[10px] text-blue-300 font-mono">
                                        {f}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Keywords */}
                              {ch.keywords && ch.keywords.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Key className="h-3.5 w-3.5 text-amber-400" />
                                    Từ khóa chính
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {ch.keywords.map((kw, kwIdx) => (
                                      <span key={kwIdx} className="text-[10px] font-semibold bg-slate-900 border border-slate-800 rounded-full py-0.5 px-2.5 text-amber-300">
                                        #{kw}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
