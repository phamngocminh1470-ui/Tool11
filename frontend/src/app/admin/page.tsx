"use client";

import React, { useState, useEffect } from "react";

interface CardItem {
  id: string;
  icon: string;
  iconBg: string;
  badge: string;
  badgeBg: string;
  title: string;
  value: string;
}

interface TransactionItem {
  id: string;
  name: string;
  plan: string;
  code: string;
  imgUrl: string;
  isApproving: boolean;
}

export default function AdminPage() {
  // ---- DYNAMIC ASSETS INJECTION ----
  useEffect(() => {
    // Inject FontAwesome icons CSS
    const faLink = document.createElement("link");
    faLink.rel = "stylesheet";
    faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(faLink);

    // Inject Google Fonts
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(faLink);
      document.head.removeChild(fontLink);
    };
  }, []);

  // ---- STATE DEFINITIONS ----
  const [cards, setCards] = useState<CardItem[]>([
    {
      id: "card-revenue",
      icon: "fa-wallet",
      iconBg: "bg-indigo-600/10 border-indigo-500/20 text-indigo-400",
      badge: "+12.5%",
      badgeBg: "text-emerald-400 bg-emerald-500/10",
      title: "Doanh thu tháng này",
      value: "45,250,000đ",
    },
    {
      id: "card-users",
      icon: "fa-users",
      iconBg: "bg-purple-600/10 border-purple-500/20 text-purple-400",
      badge: "Live",
      badgeBg: "text-purple-400 bg-purple-500/10",
      title: "Học viên đang học trực tuyến",
      value: "142 học viên",
    },
    {
      id: "card-ai",
      icon: "fa-brain",
      iconBg: "bg-amber-600/10 border-amber-500/20 text-amber-400",
      badge: "Cao",
      badgeBg: "text-rose-400 bg-rose-500/10",
      title: "AI Tokens đã tiêu thụ",
      value: "1,842,500 tokens",
    },
  ]);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: "momo-tx-1",
      name: "Nguyễn Văn A",
      plan: "Gói Pro 1 Tháng • 199,000đ",
      code: "MM20260609X",
      imgUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=600&q=80",
      isApproving: false,
    },
    {
      id: "momo-tx-2",
      name: "Trần Thị B",
      plan: "Gói Premium 1 Năm • 1,190,000đ",
      code: "MM20260609Y",
      imgUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      isApproving: false,
    },
  ]);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    name: string;
    imgUrl: string;
  }>({
    isOpen: false,
    name: "",
    imgUrl: "",
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // ---- DRAG AND DROP HANDLERS ----
  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedCardId && draggedCardId !== targetId) {
      const draggedIdx = cards.findIndex((c) => c.id === draggedCardId);
      const targetIdx = cards.findIndex((c) => c.id === targetId);

      const newCards = [...cards];
      newCards.splice(draggedIdx, 1);
      newCards.splice(targetIdx, 0, cards[draggedIdx]);
      setCards(newCards);
    }
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
  };

  // ---- ACTION HANDLERS ----
  const viewProof = (name: string, imgUrl: string) => {
    setModal({
      isOpen: true,
      name: "Minh chứng của: " + name,
      imgUrl: imgUrl,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const approveTx = (id: string) => {
    // Set isApproving to true to trigger fade-out animation
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isApproving: true } : t))
    );

    setTimeout(() => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      alert(
        "Hệ thống đã phê duyệt lệnh, kích hoạt tài khoản VIP và ghi nhận doanh thu vào Database!"
      );
    }, 500);
  };

  return (
    <div
      className="text-slate-100 min-h-screen flex"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#020617",
      }}
    >
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
              S
            </div>
            <span
              className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              StudyOS
            </span>
          </div>
          <nav className="space-y-2">
            <a
              href="#"
              className="flex items-center gap-3 bg-indigo-600/20 text-indigo-400 px-4 py-3 rounded-xl font-medium border border-indigo-500/20"
            >
              <i className="fa-solid fa-chart-pie w-5"></i> Tổng quan
            </a>
            <a
              href="#"
              className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition"
            >
              <i className="fa-solid fa-users w-5"></i> Học viên
            </a>
            <a
              href="#"
              className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition"
            >
              <i className="fa-solid fa-credit-card w-5"></i> Thanh toán MoMo
            </a>
            <a
              href="#"
              className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition"
            >
              <i className="fa-solid fa-robot w-5"></i> Cấu hình AI
            </a>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm border border-indigo-500">
            AD
          </div>
          <div>
            <p className="font-semibold text-sm">Minh Phamngoc</p>
            <p className="text-xs text-indigo-400">Super Admin</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              Hệ Thống Quản Trị
            </h1>
            <p className="text-slate-400 text-sm">
              Chào mừng quay lại! Dưới đây là tình hình vận hành hệ thống StudyOS
              năm 2026.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>{" "}
              Hệ thống ổn định
            </span>
          </div>
        </header>

        <h2
          className="text-lg font-bold mb-4 text-slate-400 flex items-center gap-2"
          style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
          <i className="fa-solid fa-grip"></i> Chỉ số chính (Giữ chuột vào ô
          bất kỳ để Kéo/Thả đổi vị trí)
        </h2>

        {/* Drag and Drop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing transition-all duration-300 ${
                draggedCardId === card.id ? "opacity-45 border-dashed border-indigo-500" : ""
              }`}
              draggable
              onDragStart={() => handleDragStart(card.id)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border ${card.iconBg}`}>
                  <i className={`fa-solid ${card.icon} text-xl`}></i>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.badgeBg}`}
                >
                  {card.badge}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-400">{card.title}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Grid Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MoMo Transactions Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-xl font-bold flex items-center gap-2"
                style={{ fontFamily: "'Urbanist', sans-serif" }}
              >
                <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>{" "}
                Lệnh thanh toán chờ duyệt (MoMo)
              </h3>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                {transactions.length} Yêu cầu mới
              </span>
            </div>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl gap-4 transition-all duration-500"
                  style={{
                    opacity: tx.isApproving ? 0 : 1,
                    transform: tx.isApproving
                      ? "translateX(50px)"
                      : "translateX(0)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
                      MoMo
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{tx.name}</p>
                      <p className="text-xs text-slate-400">{tx.plan}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Mã GD: {tx.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => viewProof(tx.name, tx.imgUrl)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-image"></i> Xem ảnh bill
                    </button>
                    <button
                      onClick={() => approveTx(tx.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-check"></i> Duyệt luôn
                    </button>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm font-semibold">
                  Tất cả lệnh thanh toán MoMo đã được phê duyệt!
                </div>
              )}
            </div>
          </div>

          {/* Google Identity Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3
                  className="text-xl font-bold flex items-center gap-2"
                  style={{ fontFamily: "'Urbanist', sans-serif" }}
                >
                  <i className="fa-brands fa-google text-indigo-400"></i> Google
                  Identity
                </h3>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded font-mono">
                  FIXED
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Trạng thái Google OAuth đã được chèn cấu hình nâng cao ép hiển
                thị bảng lựa chọn tài khoản (
                <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded font-mono">
                  select_account
                </code>
                ).
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">OAuth Prompt Mode:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    FORCE_SELECT
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Token Sync Logic:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    JWT_SECURE (256-bit)
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <p className="text-xs text-slate-400 font-medium">
                  Bản ghi Session đồng bộ thành công.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Proof Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h3
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              {modal.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Do học viên tải lên qua cổng xác thực StudyOS Checkout.
            </p>
            <div className="w-full h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-4">
              <img
                src={modal.imgUrl}
                alt="Proof"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={closeModal}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium border border-slate-700 transition cursor-pointer"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
