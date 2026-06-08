"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FileText, ChevronDown, RefreshCw } from "lucide-react";

interface Document {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
}

interface DocumentSelectorProps {
  onSelect: (docId: number, docName: string) => void;
  selectedDocId: number | null;
}

export default function DocumentSelector({ onSelect, selectedDocId }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
      
      // Auto select first document if none selected
      if (data.length > 0 && !selectedDocId) {
        onSelect(data[0].id, data[0].name);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="relative z-10 w-full max-w-md">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Tài liệu đang học tập
      </label>
      
      {loading ? (
        <div className="h-11 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
          <span className="text-sm">Đang tải danh sách tài liệu...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="h-11 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-4 text-slate-400">
          <span className="text-sm">Chưa có tài liệu nào. Hãy upload trước.</span>
          <a href="/upload" className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline">
            Tải lên
          </a>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-11 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between px-4 text-slate-200 transition-all font-medium text-sm shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span className="truncate">{selectedDoc?.name || "Chọn tài liệu học tập"}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 overflow-y-auto max-h-60">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    onSelect(doc.id, doc.name);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-800 text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${
                    doc.id === selectedDocId ? "text-purple-400 bg-purple-500/5 font-semibold" : "text-slate-300"
                  }`}
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="truncate">{doc.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
