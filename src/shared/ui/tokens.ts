import type { MotionProps } from "framer-motion";

export const BRUTAL = "border-[3px] border-black shadow-[5px_5px_0_0_#000]";
export const BRUTAL_SM = "border-2 border-black shadow-[3px_3px_0_0_#000]";

export const PRESS =
  "transition-transform duration-150 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

export const THEME = {
  camera: {
    body: "bg-[#eaf4fc]",
    navIdle: "bg-[#bfe0f7]",
    navActive: "bg-[#4f9fe0]",
    navMark: "bg-[#8cc7ef]",
  },
  calendar: {
    body: "bg-[#fdf6e3]",
    navIdle: "bg-[#f6e2a0]",
    navActive: "bg-[#f2c230]",
    navMark: "bg-[#f6d466]",
  },
  feed: {
    body: "bg-[#fdeef0]",
    navIdle: "bg-[#f8c6cd]",
    navActive: "bg-[#e8536b]",
    navMark: "bg-[#f0899b]",
  },
} as const;

export type ThemeKey = keyof typeof THEME;

export const LIST_CONTAINER = {
  initial: "hidden",
  animate: "shown",
  variants: { shown: { transition: { staggerChildren: 0.04 } } },
} as const;

export const LIST_ITEM = {
  variants: {
    hidden: { opacity: 0, y: 12 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  },
} as const;

export const HEART_TAP = { whileTap: { scale: 0.85 } } as const;

// as const면 키프레임 배열이 readonly가 돼 Variants와 안 맞는다.
export const HEART_POP: MotionProps = {
  variants: { idle: { scale: 1 }, popped: { scale: [1, 1.35, 1] } },
  transition: { duration: 0.28, ease: "easeOut" },
};
