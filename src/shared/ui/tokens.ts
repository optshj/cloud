import type { MotionProps } from "framer-motion";

// 네오브루탈리즘 공통 톤: 굵은 검은 테두리 + 블러 없는 오프셋 하드섀도
export const BRUTAL = "border-[3px] border-black shadow-[5px_5px_0_0_#000]";
export const BRUTAL_SM = "border-2 border-black shadow-[3px_3px_0_0_#000]";

// 누르는 느낌: 섀도 오프셋만큼 밀어넣고 섀도를 없앤다. 원래 Button 안에 있었는데,
// 하드섀도를 쓰는 건 버튼만이 아니라서(폴라로이드 카드·하단 네비 탭) 같은 어휘를 공유하도록 올렸다.
export const PRESS =
  "transition-transform duration-150 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

// 헤더는 네비 배지의 navIdle 색을 그대로 쓴다(헤더 전용 색 없음) — 페이지 최상단부터
// 하단 네비까지 그 탭의 색 정체성이 한 번에 읽히게.
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

// 모달 열고닫기 모션은 framer-motion이 아니라 Radix의 data-state + globals.css의
// `--animate-modal-*` 키프레임이 맡는다(shadcn-component 스킬: 둘을 겹치지 않는다).

// 목록 진입: 카드가 한꺼번에 튀지 않게 살짝 시차를 준다.
// framer-motion에 그대로 스프레드해서 쓴다 (`<motion.div {...LIST_CONTAINER} />`).
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

// 좋아요 하트 — 목록 카드와 상세 모달이 같은 하트를 쓰므로 어휘를 한 벌만 둔다.
// 버튼은 누르는 동안 눌리고(HEART_TAP), 하트는 켜지는 순간에만 한 번 팡 튄다 — 취소할 땐 조용히.
export const HEART_TAP = { whileTap: { scale: 0.85 } } as const;

// `as const`를 쓰면 키프레임 배열이 readonly가 돼 framer-motion의 Variants(가변 배열)와 안 맞는다 —
// 배열을 담는 토큰은 as const 대신 타입을 명시한다.
export const HEART_POP: MotionProps = {
  variants: { idle: { scale: 1 }, popped: { scale: [1, 1.35, 1] } },
  transition: { duration: 0.28, ease: "easeOut" },
};
