"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { 
  UploadCloud, FileText, CheckCircle, 
  RefreshCw, Trash2, ShieldAlert, Sparkles, 
  FileSpreadsheet, FileCode, Pencil, Check, X, Search 
} from "lucide-react";

interface Document {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
}

export default function UploadPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Rename States
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDocuments(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Set up polling intervals for files that are in 'processing' status
  useEffect(() => {
    const activeDocIds = Object.keys(statuses).filter(id => statuses[Number(id)] === "processing").map(Number);
    if (activeDocIds.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const nextStatuses = { ...statuses };
      
      for (const id of activeDocIds) {
        try {
          const res = await api.getAnalysisStatus(id);
          if (res.status === "completed") {
            nextStatuses[id] = "completed";
            updated = true;
          }
        } catch {
          // ignore
        }
      }

      if (updated) {
        setStatuses(nextStatuses);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [statuses]);

  const fetchDocuments = async (q?: string) => {
    setLoadingList(true);
    try {
      const list = await api.getDocuments(q);
      setDocuments(list);
      
      // Initialize AI status checks
      const nextStatuses: Record<number, string> = {};
      for (const doc of list) {
        try {
          const res = await api.getAnalysisStatus(doc.id);
          nextStatuses[doc.id] = res.status;
        } catch {
          nextStatuses[doc.id] = "completed";
        }
      }
      setStatuses(nextStatuses);
    } catch (err: any) {
      setError("Không thể tải danh sách tài liệu");
    } finally {
      setLoadingList(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const doc = await api.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      }) as any;
      
      // Append to lists
      setDocuments((prev) => [doc, ...prev]);
      setStatuses((prev) => ({ ...prev, [doc.id]: "processing" }));
      setUploadProgress(100);
    } catch (err: any) {
      setError(err.message || "Tải tài liệu lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này không? Mọi câu hỏi, tóm tắt và flashcard đi kèm cũng sẽ bị xóa.")) {
      return;
    }
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter(d => d.id !== id));
      const nextStat = { ...statuses };
      delete nextStat[id];
      setStatuses(nextStat);
    } catch (err) {
      setError("Không thể xóa tài liệu");
    }
  };

  const handleStartRename = (id: number, name: string) => {
    setEditingDocId(id);
    setEditingName(name);
  };

  const handleSaveRename = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await api.renameDocument(id, editingName.trim());
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: editingName.trim() } : d));
      setEditingDocId(null);
    } catch (err: any) {
      setError(err.message || "Đổi tên tài liệu thất bại");
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <UploadCloud className="h-8 w-8 text-purple-400" />
            Tải lên tài liệu học tập
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Hỗ trợ PDF, DOCX, PPTX, TXT và các tệp hình ảnh. AI sẽ tự động phân tích và tạo bài học.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInputClick}
          className={`glass-panel border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            dragActive 
              ? "border-purple-500 bg-purple-500/5 shadow-2xl scale-[1.01]" 
              : "border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          
          <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 shadow-md group-hover:scale-110 transition-transform mb-4">
            <UploadCloud className="h-7 w-7 text-purple-400" />
          </div>
          
          <p className="font-bold text-slate-200">Kéo thả tài liệu vào đây</p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
            hoặc click để duyệt tìm tệp trong máy tính của bạn. Hạn mức tối đa 20MB.
          </p>

          {uploading && (
            <div className="w-full max-w-xs mt-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                <span>Đang tải lên tài liệu...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Document List Section with Search filter */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Tài liệu của bạn ({documents.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tài liệu..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg text-slate-200 text-xs focus:outline-none transition-all placeholder:text-slate-650"
              />
            </div>
          </div>

          {loadingList && searchQuery === "" ? (
            <div className="h-40 flex items-center justify-center glass-panel rounded-xl">
              <RefreshCw className="h-7 w-7 text-purple-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm glass-panel rounded-xl border border-slate-850">
              <FileSpreadsheet className="h-8 w-8 text-slate-600 mb-2" />
              <span>
                {searchQuery 
                  ? "Không tìm thấy tài liệu phù hợp với tìm kiếm." 
                  : "Chưa có tài liệu nào được tải lên. Hãy thử tải lên một tệp đầu tiên!"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const status = statuses[doc.id] || "completed";
                const isProcessing = status === "processing";
                const isEditing = editingDocId === doc.id;

                return (
                  <div 
                    key={doc.id} 
                    className="glass-panel rounded-xl p-4 flex items-center justify-between border border-slate-800/80 shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 flex-shrink-0">
                        {isProcessing ? (
                          <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />
                        ) : (
                          <FileCode className="h-5 w-5 text-purple-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mr-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 bg-slate-950 border border-purple-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveRename(doc.id)}
                              className="p-1 rounded bg-purple-600/20 text-purple-400 border border-purple-500/20 hover:bg-purple-600/30 cursor-pointer"
                              title="Lưu"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingDocId(null)}
                              className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 cursor-pointer"
                              title="Hủy"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-slate-200 truncate pr-2" title={doc.name}>
                            {doc.name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-medium">
                          <span>{formatBytes(doc.size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {isProcessing ? (
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>AI đang đọc...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" />
                          <span>Đã phân tích</span>
                        </div>
                      )}
                      
                      {!isProcessing && !isEditing && (
                        <button
                          onClick={() => handleStartRename(doc.id, doc.name)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/30 hover:bg-purple-500/10 text-slate-500 hover:text-purple-400 transition-all cursor-pointer"
                          title="Sửa tên tài liệu"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
