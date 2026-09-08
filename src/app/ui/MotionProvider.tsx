"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// 원래 QueryProvider였는데, react-query를 쓰는 코드가 한 줄도 없었다(조회는 전부 useState+useEffect).
// 빈 QueryClientProvider가 클라이언트 번들만 키우고 있어서 걷어내고, 같이 들어 있던 MotionConfig만
// 남겼다 — 이쪽은 실제로 동작하는 접근성 설정이다.
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  // framer-motion 모션은 인라인 스타일이라 globals.css의 prefers-reduced-motion 블록을 통과한다 —
  // 컴포넌트마다 useReducedMotion()으로 분기하는 대신 여기서 한 번에 끈다(interaction-design 스킬).
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
