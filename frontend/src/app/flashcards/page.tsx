"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import DocumentSelector from "@/components/DocumentSelector";
import { api } from "@/lib/api";
import { 
  Layers, RotateCw, Check, X, 
  Sparkles, RefreshCw, ChevronLeft, ChevronRight, HelpCircle 
} from "lucide-react";

interface Flashcard {
  id: number;
  document_id: number;
  question: string;
  answer: string;
  definition: string | null;
  category: string;
  box_level: number;
  next_review_at: string;
}

export default function FlashcardsPage() {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<"learn" | "review">("learn");

  useEffect(() => {
    if (selectedDocId) {
      loadFlashcards(selectedDocId);
    }
  }, [selectedDocId]);

  const loadFlashcards = async (docId: number) => {
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const data = await api.getFlashcards(docId);
      setCards(data);
    } catch (err) {
      console.error("Failed to load flashcards", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (id: number, name: string) => {
    setSelectedDocId(id);
    setSelectedDocName(name);
  };

  const handleLeitnerSubmit = async (correct: boolean) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    
    // Leitner level calculations
    let nextLevel = currentCard.box_level;
    if (correct) {
      nextLevel = Math.min(5, nextLevel + 1);
    } else {
      nextLevel = Math.max(1, nextLevel - 1);
    }

    try {
      // Optimistic update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex] = {
        ...currentCard,
        box_level: nextLevel
      };
      setCards(updatedCards);

      await api.reviewFlashcard({
        flashcard_id: currentCard.id,
        box_level: nextLevel
      });
    } catch (err) {
      console.error("Failed to update card level", err);
    }

    // Go to next card automatically after a brief timeout
    setTimeout(() => {
      handleNext();
    }, 150);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to start
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  // Filter cards based on Study Mode selection
  // "learn" displays all cards
  // "review" filters only cards scheduled for today or earlier
  const filteredCards = cards.filter(card => {
    if (studyMode === "learn") return true;
    const reviewDate = new Date(card.next_review_at);
    const today = new Date();
    return reviewDate <= today;
  });

  const activeCard = filteredCards[currentIndex];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 flex-1">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <Layers className="h-8 w-8 text-purple-400" />
              Ôn tập Flashcard AI
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Hệ thống chủ động lặp lại ngắt quãng (Leitner Leitner Spaced Repetition) giúp tối ưu trí nhớ dài hạn.
            </p>
          </div>
          <DocumentSelector onSelect={handleSelectDoc} selectedDocId={selectedDocId} />
        </div>

        {/* Display modes */}
        {selectedDocId && cards.length > 0 && (
          <div className="flex justify-between items-center bg-slate-900/20 p-1 rounded-xl max-w-sm w-full border border-slate-900">
            <button
              onClick={() => { setStudyMode("learn"); setCurrentIndex(0); setIsFlipped(false); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                studyMode === "learn"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Học tất cả ({cards.length})
            </button>
            <button
              onClick={() => { setStudyMode("review"); setCurrentIndex(0); setIsFlipped(false); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                studyMode === "review"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Đến hạn ôn ({cards.filter(c => new Date(c.next_review_at) <= new Date()).length})
            </button>
          </div>
        )}

        {/* Dynamic Display */}
        {!selectedDocId ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-purple-500/50 mb-3 animate-pulse" />
            <span>Vui lòng chọn tài liệu để tải bộ Flashcard</span>
          </div>
        ) : loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400 font-medium">Đang tải Flashcards...</span>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Check className="h-8 w-8 text-emerald-500/60 mb-3" />
            <span>
              {studyMode === "review" 
                ? "Tuyệt vời! Bạn đã hoàn thành tất cả Flashcard cần ôn tập hôm nay." 
                : "Không tìm thấy bộ thẻ từ tài liệu này. Vui lòng thử lại sau ít phút."}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-xl w-full mx-auto gap-6">
            
            {/* Card Widget */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 relative cursor-pointer group"
              style={{ perspective: "1000px" }}
            >
              <div 
                className="w-full h-full duration-500 transition-all rounded-2xl relative shadow-2xl"
                style={{ 
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                {/* Front face (Question) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
                      {activeCard.category || "Chủ đề chính"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Hộp Leitner #{activeCard.box_level}</span>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center text-center my-4">
                    <p className="text-lg font-bold text-slate-200 leading-relaxed">
                      {activeCard.question}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider border-t border-slate-800/40 pt-3 group-hover:text-purple-400 transition-colors">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Lật để xem đáp án</span>
                  </div>
                </div>

                {/* Back face (Answer + Definition) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between"
                  style={{ 
                    backfaceVisibility: "hidden", 
                    transform: "rotateY(180deg)" 
                  }}
                >
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Đáp án</span>
                    <span className="text-xs text-slate-500 font-semibold">Leitner Level {activeCard.box_level}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 text-center flex flex-col justify-center">
                    <p className="text-base font-bold text-slate-100">{activeCard.answer}</p>
                    {activeCard.definition && (
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto italic">
                        {activeCard.definition}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider border-t border-slate-850 pt-3">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Click để lật lại câu hỏi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-6 text-sm text-slate-400 font-semibold">
              <button
                onClick={handlePrev}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span>{currentIndex + 1} / {filteredCards.length}</span>
              <button
                onClick={handleNext}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Leitner Feedback controls */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-900 pt-6">
              <button
                onClick={() => handleLeitnerSubmit(false)}
                className="py-3 px-4 bg-slate-900 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                <X className="h-4 w-4" />
                Chưa thuộc (Gặp lại sớm)
              </button>
              
              <button
                onClick={() => handleLeitnerSubmit(true)}
                className="py-3 px-4 bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                <Check className="h-4 w-4" />
                Đã thuộc (Tăng hộp Leitner)
              </button>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
