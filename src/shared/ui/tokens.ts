// 네오브루탈리즘 공통 톤: 굵은 검은 테두리 + 블러 없는 오프셋 하드섀도
export const BRUTAL = "border-[3px] border-black shadow-[5px_5px_0_0_#000]";
export const BRUTAL_SM = "border-2 border-black shadow-[3px_3px_0_0_#000]";

export const THEME = {
  camera: {
    header: "bg-gradient-to-b from-sky-300 to-sky-200",
    body: "bg-gradient-to-b from-sky-100 to-sky-50",
    active: "bg-sky-200",
  },
  calendar: {
    header: "bg-gradient-to-b from-violet-300 to-violet-200",
    body: "bg-gradient-to-b from-violet-100 to-violet-50",
    active: "bg-violet-200",
  },
  feed: {
    header: "bg-gradient-to-b from-rose-300 to-orange-200",
    body: "bg-gradient-to-b from-rose-100 to-orange-50",
    active: "bg-rose-200",
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
