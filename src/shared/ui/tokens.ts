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
