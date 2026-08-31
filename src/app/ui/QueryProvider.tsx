"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {/* framer-motion 모션은 인라인 스타일이라 globals.css의 prefers-reduced-motion
          블록을 통과한다 — 컴포넌트마다 useReducedMotion()으로 분기하는 대신 여기서 한 번에 끈다
          (interaction-design 스킬). */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
};
