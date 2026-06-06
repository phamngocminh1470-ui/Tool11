"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  MessageSquare, Send, Sparkles, RefreshCw, 
  HelpCircle, Quote, Library, ScrollText 
} from "lucide-react";

interface Citation {
  source: string;
  page: number | null;
  context: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function TutorPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  useEffect(() => {
    if (selectedDocId) {
      // Clear history when switching document
      setChatHistory([
        { 
          role: "assistant", 
          content: `Xin chào! Tôi là AI Tutor của bạn cho tài liệu "${selectedDocName}". Hãy đặt câu hỏi bất kỳ, ví dụ như: 'Giải thích chương 1' hoặc 'Tóm tắt ý chính của file này'.`
        }
      ]);
      setActiveCitation(null);
    }
  }, [selectedDocId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedDocId || loading) return;

    const userMsg = inputMessage;
    setInputMessage("");
    
    // Add user message to chat list
    const updatedHistory: Message[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updatedHistory);
    setLoading(true);

    try {
      // API payload expects history formatted as array
      const response = await api.askTutor({
        document_id: selectedDocId,
        message: userMsg,
        history: updatedHistory.slice(0, -1) // skip the latest user message which is in the body
      });

      setChatHistory(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: response.answer,
          citations: response.citations
        }
      ]);
      
      // Auto display first citation if available
      if (response.citations && response.citations.length > 0) {
        setActiveCitation(response.citations[0]);
      }
    } catch (err) {
      console.error("AI Tutor failed to reply", err);
      setChatHistory(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Rất tiếc, tôi không thể xử lý câu hỏi này lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-[calc(100vh-80px)]">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-6.5 w-6.5 text-purple-400" />
              AI Tutor Chat
            </h1>
            <p className="text-slate-400 mt-0.5 text-xs">
              Hỏi đáp trực tiếp với tài liệu. AI sẽ trích xuất trích dẫn nguồn hỗ trợ đối chiếu thông tin.
            </p>
          </div>
          <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
        </div>

        {/* Content Box split: Left is Chat, Right is Citations details */}
        {!selectedDocId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-purple-500/50 mb-3 animate-pulse" />
            <span>Vui lòng chọn tài liệu để bắt đầu trò chuyện cùng AI Tutor</span>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
            {/* Left side: Chat Window */}
            <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-slate-850 overflow-hidden shadow-2xl relative">
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatHistory.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={idx}
                      className={`flex ${isUser ? "justify-end" : "justify-start animate-fade-in"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser 
                          ? "bg-purple-600 text-white rounded-tr-none shadow-md font-medium" 
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-medium"
                      }`}>
                        {/* Message Content */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Citation Badges */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Library className="h-3 w-3" /> Trích dẫn:
                            </span>
                            {msg.citations.map((cit, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setActiveCitation(cit)}
                                className={`text-[10px] py-1 px-2.5 rounded font-semibold cursor-pointer border transition-colors ${
                                  activeCitation?.context === cit.context
                                    ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                              >
                                {cit.source} {cit.page ? `(Trang ${cit.page})` : ""}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 shadow-md">
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-850 bg-slate-900/40 flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Hỏi AI Tutor: 'Tóm tắt chương 2 cho tôi'..."
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-700"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>

            {/* Right side: Citations Drawer Details */}
            {activeCitation && (
              <div className="w-80 glass-panel rounded-2xl p-6 border border-slate-850 flex flex-col gap-4 shadow-xl hidden md:flex">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-850 pb-3">
                  <ScrollText className="h-4 w-4 text-purple-400" />
                  Chi tiết trích dẫn nguồn
                </h3>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mục trích dẫn:</span>
                    <p className="text-xs font-bold text-slate-200">{activeCitation.source}</p>
                  </div>

                  {activeCitation.page && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trang tham chiếu:</span>
                      <p className="text-xs font-bold text-slate-200">Trang {activeCitation.page}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-850/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Ngữ cảnh đối chiếu (Context):</span>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-850 text-slate-400 text-xs leading-relaxed whitespace-pre-wrap italic relative">
                      <Quote className="absolute top-1 right-2 h-6 w-6 text-slate-800/40 rotate-180 pointer-events-none" />
                      {activeCitation.context}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
