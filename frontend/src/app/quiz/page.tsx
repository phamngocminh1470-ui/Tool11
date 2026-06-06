"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  HelpCircle, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, Sparkles, HelpCircle as HelpIcon 
} from "lucide-react";

interface Quiz {
  id: number;
  type: string;
  difficulty: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
}

export default function QuizPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Track state for answered questions
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (selectedDocId) {
      loadQuizzes(selectedDocId);
    }
  }, [selectedDocId]);

  const loadQuizzes = async (docId: number) => {
    setLoading(true);
    setQuizzes([]);
    setAnswers({});
    setSubmitted({});
    try {
      const data = await api.getQuizzes(docId);
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  const handleSelectOption = (quizId: number, option: string) => {
    if (submitted[quizId]) return; // locked
    setAnswers(prev => ({ ...prev, [quizId]: option }));
  };

  const handleSubmitAnswer = (quizId: number) => {
    if (!answers[quizId]) return;
    setSubmitted(prev => ({ ...prev, [quizId]: true }));
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <HelpCircle className="h-8 w-8 text-purple-400" />
              Luyện tập Trắc nghiệm AI
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Làm các câu hỏi tự động sinh từ tài liệu học tập của bạn, được chia theo nhiều mức độ và loại câu hỏi.
            </p>
          </div>
          <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
        </div>

        {/* Dynamic Display */}
        {!selectedDocId ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-purple-500/50 mb-3 animate-pulse" />
            <span>Vui lòng chọn tài liệu để tải bộ câu hỏi luyện tập</span>
          </div>
        ) : loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400 font-medium">AI đang tải các câu hỏi...</span>
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-amber-500/60 mb-3" />
            <span className="text-center px-4 max-w-sm text-xs leading-relaxed">
              Tài liệu đang xử lý phân tích ngầm hoặc không tìm thấy câu hỏi tương thích. Vui lòng tải lại trang sau ít giây.
            </span>
          </div>
        ) : (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {quizzes.map((quiz, index) => {
              const userAnswer = answers[quiz.id] || "";
              const isSubmitted = submitted[quiz.id] || false;
              const isCorrect = userAnswer.toLowerCase() === quiz.correct_answer.toLowerCase();
              
              return (
                <div 
                  key={quiz.id}
                  className="glass-panel rounded-2xl p-6 border border-slate-850 shadow-xl space-y-4"
                >
                  {/* Category Header */}
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Câu hỏi {index + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold capitalize">Độ khó: {quiz.difficulty}</span>
                  </div>

                  {/* Question */}
                  <p className="text-sm font-bold text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {quiz.question}
                  </p>

                  {/* Multiple Choice options */}
                  {quiz.options && quiz.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {quiz.options.map((opt, oIdx) => {
                        const isSelected = userAnswer === opt;
                        let optionClass = "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300";
                        
                        if (isSelected) {
                          optionClass = "bg-purple-500/10 border-purple-500 text-purple-300";
                        }
                        
                        if (isSubmitted) {
                          const isOptCorrect = opt.toLowerCase() === quiz.correct_answer.toLowerCase();
                          if (isOptCorrect) {
                            optionClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                          } else if (isSelected && !isCorrect) {
                            optionClass = "bg-red-500/10 border-red-500 text-red-400";
                          } else {
                            optionClass = "bg-slate-900/40 border-slate-850 text-slate-500 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectOption(quiz.id, opt)}
                            disabled={isSubmitted}
                            className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-start gap-2.5 cursor-pointer ${optionClass}`}
                          >
                            <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Input for Fill in the Blanks / Essays */}
                  {!quiz.options && (
                    <div className="mt-4">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={userAnswer}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [quiz.id]: e.target.value }))}
                        placeholder="Nhập đáp án của bạn..."
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all placeholder:text-slate-700 disabled:opacity-50"
                      />
                    </div>
                  )}

                  {/* Feedback on submission */}
                  {isSubmitted ? (
                    <div className={`mt-4 p-4 rounded-xl text-xs font-medium space-y-2 leading-relaxed border ${
                      isCorrect 
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-red-950/20 border-red-500/30 text-red-300"
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                            <span>Đáp án chính xác!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4.5 w-4.5 text-red-400" />
                            <span>Đáp án chưa chính xác</span>
                          </>
                        )}
                      </div>
                      
                      {!isCorrect && (
                        <p>
                          Đáp án đúng là: <strong className="text-emerald-400">{quiz.correct_answer}</strong>
                        </p>
                      )}
                      
                      {quiz.explanation && (
                        <div className="border-t border-slate-800/40 pt-2 mt-2 text-slate-400 text-xs">
                          <strong className="text-slate-300 font-semibold block mb-1">Giải thích chi tiết:</strong>
                          <span>{quiz.explanation}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleSubmitAnswer(quiz.id)}
                        disabled={!userAnswer}
                        className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer disabled:opacity-50"
                      >
                        Kiểm tra kết quả
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
