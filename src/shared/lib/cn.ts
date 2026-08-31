import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn 컴포넌트가 variant 클래스와 호출부 className을 합칠 때 쓴다.
// 단순 문자열 합성(`${BRUTAL} bg-white`)까지 cn()으로 감싸지 않는다 — 충돌 병합이 필요할 때만.
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
