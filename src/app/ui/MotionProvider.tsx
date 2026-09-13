"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export const MotionProvider = ({ children }: { children: ReactNode }) => (
  // framer-motion은 인라인 스타일이라 CSS reduced-motion 블록을 통과한다 — 여기서 끈다.
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
