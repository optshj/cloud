import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Gothic_A1 } from "next/font/google";
import "../globals.css";
import { MotionProvider } from "./MotionProvider";
import { PageTransitionProvider } from "@/widgets/app-shell";
import { Toaster } from "@/shared/ui/sonner";

// 네오브루탈리즘에 맞는 굵은 임팩트 + 한글 지원(100~900 전체 웨이트)
const gothicA1 = Gothic_A1({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "구름 수집 (가제)",
  description: "매일 하늘/구름을 촬영하고 AI 코멘트와 함께 캘린더에 기록하는 다이어리",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${gothicA1.variable} h-full antialiased`}>
      <body className="min-h-full">
        <MotionProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
          {/* 에러 메시지 공통 채널 — 화면 어디서든 toast.error()로 띄운다. */}
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
