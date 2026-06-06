"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  GraduationCap, Clock, ShieldAlert, CheckCircle, 
  RefreshCw, PlayCircle, EyeOff, ClipboardCheck, AlertTriangle 
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

interface IncorrectDetail {
  quiz_id: number;
  question: string;
  correct_answer: string;
  user_answer: string;
  explanation: string;
}

interface ExamResult {
  exam_id: number;
  score: number;
  duration_seconds: number;
  tab_switch_count: number;
  correct_count: number;
  total_count: number;
  incorrect_details: IncorrectDetail[];
}

export default function ExamPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Exam configs
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");

  // Exam States
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [examId, setExamId] = useState<number | null>(null);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  
  // Anti-Tab-Switching States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  // Answers
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Results
  const [result, setResult] = useState<ExamResult | null>(null);

  // Refs for tracking active values inside event listeners
  const examRunningRef = useRef(isExamRunning);
  const tabSwitchesRef = useRef(tabSwitches);
  const examIdRef = useRef(examId);
  const answersRef = useRef(answers);
  const initialDurationRef = useRef(initialDuration);
  const timeLeftRef = useRef(timeLeft);

  // Keep refs up-to-date
  useEffect(() => { examRunningRef.current = isExamRunning; }, [isExamRunning]);
  useEffect(() => { tabSwitchesRef.current = tabSwitches; }, [tabSwitches]);
  useEffect(() => { examIdRef.current = examId; }, [examId]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { initialDurationRef.current = initialDuration; }, [initialDuration]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Handle countdown timer
  useEffect(() => {
    if (!isExamRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceSubmit("Hết giờ làm bài!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamRunning]);

  // Handle Tab-Switching detection (Page Visibility API + Blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!examRunningRef.current) return;
      
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleWindowBlur = () => {
      if (!examRunningRef.current) return;
      handleViolation();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const handleViolation = () => {
    const nextViolations = tabSwitchesRef.current + 1;
    setTabSwitches(nextViolations);
    
    if (nextViolations >= 3) {
      handleForceSubmit("Hệ thống tự động nộp bài vì phát hiện chuyển tab vi phạm quá 3 lần!");
    } else {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000); // hide warning banner after 5s
    }
  };

  const handleForceSubmit = async (reason: string) => {
    alert(reason);
    await executeSubmission();
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  const handleStartExam = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    setResult(null);
    setAnswers({});
    setTabSwitches(0);
    setShowWarning(false);
    
    try {
      const res = await api.startExam({
        document_id: selectedDocId,
        num_questions: numQuestions,
        difficulty: difficulty
      });
      
      setQuestions(res.questions);
      setExamId(res.exam_id);
      setTimeLeft(res.duration_seconds);
      setInitialDuration(res.duration_seconds);
      setIsExamRunning(true);
    } catch (err) {
      console.error("Failed to start exam", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId: number, opt: string) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const executeSubmission = async () => {
    if (!examIdRef.current) return;
    setSubmitting(true);
    setIsExamRunning(false);
    
    // Calculate elapsed duration
    const elapsedSeconds = initialDurationRef.current - timeLeftRef.current;
    
    // Format answers array
    const formattedAnswers = Object.entries(answersRef.current).map(([qId, val]) => ({
      quiz_id: Number(qId),
      answer: val
    }));

    try {
      const res = await api.submitExam({
        exam_id: examIdRef.current,
        answers: formattedAnswers,
        duration_seconds: elapsedSeconds,
        tab_switch_count: tabSwitchesRef.current
      });
      setResult(res);
      setExamId(null);
    } catch (err) {
      console.error("Failed to submit exam", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    if (confirm("Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?")) {
      executeSubmission();
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Warning Banner for Tab Switches */}
        {showWarning && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-red-600 border border-red-500 rounded-xl p-4 shadow-2xl flex items-start gap-3 z-50 text-white animate-bounce">
            <AlertTriangle className="h-6 w-6 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wider">CẢNH BÁO VI PHẠM!</p>
              <p className="text-xs font-semibold mt-1">
                Phát hiện chuyển tab/màn hình ({tabSwitches}/3 lần). Vi phạm 3 lần hệ thống sẽ tự động nộp bài!
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-purple-400" />
              Chế độ Thi Thử (Exam Mode)
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Môi trường thi thử chuẩn hóa: có đếm giờ, giám sát rời tab và phân tích lỗi sai tự động.
            </p>
          </div>
          {!isExamRunning && (
            <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
          )}
        </div>

        {/* Main Display Controller */}
        {!selectedDocId && !isExamRunning ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <GraduationCap className="h-8 w-8 text-purple-500/50 mb-3" />
            <span>Vui lòng chọn tài liệu học tập để chuẩn bị thi thử</span>
          </div>
        ) : loading ? (
          <div className="h-80 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : !isExamRunning && !result ? (
          /* Parameter configuration Screen */
          <div className="max-w-md w-full mx-auto glass-panel rounded-2xl p-8 border border-slate-850 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-3">
              <PlayCircle className="h-5 w-5 text-purple-400" />
              Cấu hình đề thi
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Số lượng câu hỏi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map(num => (
                    <button
                      key={num}
                      onClick={() => setNumQuestions(num)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        numQuestions === num
                          ? "bg-purple-600/20 border-purple-500 text-purple-400"
                          : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Độ khó đề thi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "easy", label: "Dễ" },
                    { key: "medium", label: "Trung bình" },
                    { key: "hard", label: "Khó" },
                    { key: "expert", label: "Chuyên sâu" }
                  ].map(lvl => (
                    <button
                      key={lvl.key}
                      onClick={() => setDifficulty(lvl.key)}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        difficulty === lvl.key
                          ? "bg-purple-600/20 border-purple-500 text-purple-400"
                          : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm cursor-pointer"
            >
              Bắt đầu làm bài
            </button>
          </div>
        ) : isExamRunning ? (
          /* ACTIVE EXAM INTERFACE */
          <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto relative">
            {/* Header info / Timer */}
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-15 py-3 border-b border-slate-900 flex justify-between items-center px-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <Clock className="h-4.5 w-4.5 text-purple-400" />
                <span>Thời gian còn lại:</span>
                <span className="font-mono text-base font-extrabold text-purple-400">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>Số lần rời tab: <strong className="text-red-500">{tabSwitches}/3</strong></span>
              </div>
            </div>

            {/* Questions container */}
            <div className="space-y-6 mt-4">
              {questions.map((q, idx) => {
                const selectedAns = answers[q.id] || "";
                return (
                  <div key={q.id} className="glass-panel rounded-2xl p-6 border border-slate-850 shadow-lg space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Câu hỏi {idx + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-200 whitespace-pre-wrap">{q.question}</p>

                    {/* Options list */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAns === opt;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleOptionSelect(q.id, opt)}
                              className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                                isSelected 
                                  ? "bg-purple-500/10 border-purple-500 text-purple-300 font-bold" 
                                  : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                              }`}
                            >
                              <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Text field input */}
                    {!q.options && (
                      <input
                        type="text"
                        value={selectedAns}
                        onChange={(e) => handleOptionSelect(q.id, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="w-full mt-2 px-4 py-3 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end border-t border-slate-900 pt-6 mt-4">
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="py-3 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
              >
                {submitting ? "Đang chấm điểm..." : "Nộp bài thi"}
              </button>
            </div>
          </div>
        ) : (
          /* EXAM RESULT DASHBOARD */
          <div className="max-w-3xl w-full mx-auto space-y-6">
            
            {/* Scorecard panel */}
            <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-850 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-10%] h-48 w-48 rounded-full bg-purple-500/10 filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-10%] h-48 w-48 rounded-full bg-blue-500/10 filter blur-3xl pointer-events-none" />

              <h2 className="text-xl font-bold text-slate-200 flex items-center justify-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-400" />
                Kết quả bài thi thử
              </h2>

              <div className="flex flex-col items-center">
                <div className="h-32 w-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950/40 shadow-inner">
                  <span className={`text-4xl font-extrabold ${result!.score >= 80 ? "text-emerald-400" : result!.score >= 50 ? "text-purple-400" : "text-amber-400"}`}>
                    {result!.score.toFixed(0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Điểm số %</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-900 py-4 max-w-md mx-auto text-xs">
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider">Làm đúng</p>
                  <p className="text-base font-bold text-slate-200 mt-1">{result!.correct_count} / {result!.total_count}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider">Thời gian</p>
                  <p className="text-base font-bold text-slate-200 mt-1">{formatTime(result!.duration_seconds)}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase tracking-wider">Lượt rời tab</p>
                  <p className={`text-base font-bold mt-1 ${result!.tab_switch_count > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {result!.tab_switch_count}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className="py-2.5 px-6 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
              >
                Làm đề thi mới
              </button>
            </div>

            {/* Error analysis list */}
            {result!.incorrect_details.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <EyeOff className="h-4 w-4 text-red-400" />
                  Chi tiết lỗi sai ({result!.incorrect_details.length})
                </h3>

                <div className="space-y-4">
                  {result!.incorrect_details.map((detail, idx) => (
                    <div 
                      key={idx}
                      className="glass-panel rounded-xl p-5 border border-slate-850 shadow-md space-y-3"
                    >
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        <span className="text-red-400 font-bold mr-1">#{idx + 1}</span> {detail.question}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed border-t border-b border-slate-900 py-2.5">
                        <div>
                          <span className="text-slate-500 font-semibold uppercase tracking-wider">Đáp án bạn chọn:</span>
                          <p className="text-red-400 font-bold mt-0.5">{detail.user_answer}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold uppercase tracking-wider">Đáp án chính xác:</span>
                          <p className="text-emerald-400 font-bold mt-0.5">{detail.correct_answer}</p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed pt-1">
                        <strong className="text-slate-300 font-semibold block mb-1">Giải pháp / Giải thích:</strong>
                        <span>{detail.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result!.incorrect_details.length === 0 && (
              <div className="glass-panel rounded-xl p-8 text-center text-slate-300 border border-slate-850 shadow-md flex flex-col items-center gap-2">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
                <p className="font-bold">Tuyệt vời! Bạn không trả lời sai câu hỏi nào.</p>
                <p className="text-xs text-slate-500">Giữ vững phong độ này trong các bài thi tiếp theo nhé!</p>
              </div>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  );
}
