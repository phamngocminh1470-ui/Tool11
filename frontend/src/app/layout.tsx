import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "StudyOS AI - Hệ thống học tập thông minh bằng AI",
  description: "Tải lên tài liệu học tập của bạn và để AI biến chúng thành tóm tắt, sơ đồ mindmap, flashcards học tập và bài thi thử chất lượng cao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-purple-600/30`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
