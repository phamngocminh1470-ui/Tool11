"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  GitBranch, Calendar, Network, ChevronRight, 
  RefreshCw, Sparkles, HelpCircle 
} from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: string;
  parent_id: string | null;
}

interface TimelineItem {
  event: string;
  time: string;
  description: string;
}

interface Relationship {
  source: string;
  target: string;
  relation: string;
}

interface KnowledgeMap {
  nodes: Node[];
  timeline: TimelineItem[];
  relationships: Relationship[];
  mermaid_code: string;
}

export default function KnowledgeMapPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [kMap, setKMap] = useState<KnowledgeMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "timeline" | "relationships">("visual");

  useEffect(() => {
    if (selectedDocId) {
      loadKnowledgeMap(selectedDocId);
    }
  }, [selectedDocId]);

  const loadKnowledgeMap = async (docId: number) => {
    setLoading(true);
    setKMap(null);
    try {
      const data = await api.getKnowledgeMap(docId);
      setKMap(data);
    } catch (err) {
      console.error("Failed to load knowledge map", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  // Helper to build recursive tree rendering
  const renderTree = (parentId: string | null) => {
    if (!kMap) return null;
    const children = kMap.nodes.filter(node => node.parent_id === parentId);
    if (children.length === 0) return null;

    return (
      <ul className="pl-6 border-l border-slate-800 space-y-3 mt-2">
        {children.map(child => (
          <li key={child.id} className="relative">
            <span className="absolute left-[-24px] top-[14px] w-4 border-t border-slate-800"></span>
            <div className="glass-panel rounded-lg py-2.5 px-4 inline-flex items-center gap-2 border border-slate-800 hover:border-purple-500/20 max-w-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${
                child.type === "root" 
                  ? "bg-purple-500" 
                  : child.type === "chapter" 
                  ? "bg-blue-500" 
                  : "bg-amber-500"
              }`}></span>
              <span className="text-xs font-semibold text-slate-200 truncate">{child.label}</span>
            </div>
            {renderTree(child.id)}
          </li>
        ))}
      </ul>
    );
  };

  const rootNode = kMap?.nodes.find(n => n.parent_id === null || n.type === "root");

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-purple-400" />
              Sơ đồ kiến thức AI
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Liên kết các chủ đề, xây dựng trục dòng thời gian sự kiện, và quan hệ giữa các khái niệm học thuật.
            </p>
          </div>
          <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
        </div>

        {/* Dynamic Display */}
        {!selectedDocId ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-purple-500/50 mb-3 animate-pulse" />
            <span>Vui lòng chọn tài liệu để khởi dựng sơ đồ kiến thức</span>
          </div>
        ) : loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400 font-medium">AI đang vẽ sơ đồ học tập...</span>
            </div>
          </div>
        ) : !kMap ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <RefreshCw className="h-8 w-8 text-purple-500/50 mb-3 animate-spin" />
            <span className="text-center max-w-sm text-xs leading-relaxed px-4">
              Tài liệu đang xử lý phân tích ban đầu. Vui lòng thử lại sau vài giây.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Display switches */}
            <div className="flex border-b border-slate-800 bg-slate-900/20 p-1 rounded-xl max-w-md w-full">
              {(["visual", "timeline", "relationships"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    viewMode === mode
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "visual" && "Cây phân rã"}
                  {mode === "timeline" && "Dòng thời gian"}
                  {mode === "relationships" && "Mối quan hệ"}
                </button>
              ))}
            </div>

            {/* TAB: Mindmap Visual tree */}
            {viewMode === "visual" && (
              <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-xl overflow-x-auto min-h-[450px]">
                <div className="min-w-[500px]">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-purple-400" />
                    Cây thư mục kiến thức
                  </h3>
                  
                  {rootNode ? (
                    <div className="relative">
                      <div className="glass-panel rounded-xl py-3 px-5 inline-flex items-center gap-2.5 border-l-4 border-l-purple-500 shadow-md">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-extrabold text-slate-100">{rootNode.label}</span>
                      </div>
                      {renderTree(rootNode.id)}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">Không tìm thấy gốc sơ đồ.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Timeline */}
            {viewMode === "timeline" && (
              <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  Dòng thời gian phân bổ lộ trình học tập
                </h3>
                
                <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8 py-2">
                  {kMap.timeline.map((item, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute left-[-31px] top-1.5 h-4 w-4 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:scale-125 transition-transform duration-250 z-10"></span>
                      
                      <div className="glass-panel rounded-xl p-5 shadow-lg max-w-2xl border border-slate-850 hover:border-purple-500/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {item.time}
                        </span>
                        <h4 className="font-bold text-slate-200 text-sm mt-2">{item.event}</h4>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Relationships */}
            {viewMode === "relationships" && (
              <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <Network className="h-4 w-4 text-amber-400" />
                  Bảng quan hệ khái niệm học thuật
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kMap.relationships.map((rel, idx) => (
                    <div 
                      key={idx}
                      className="glass-panel rounded-xl p-4 border border-slate-850 flex flex-col justify-between hover:border-amber-500/20 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-1 text-slate-200 text-xs font-semibold truncate">
                        <span className="truncate">{rel.source}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate text-purple-400">{rel.target}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-2 text-[10px] text-slate-500">
                        <span className="font-bold uppercase tracking-wider">Quan hệ:</span>
                        <span className="text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {rel.relation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
