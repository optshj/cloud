"use client";

import { BRUTAL } from "@/shared/ui/tokens";
import { signInWithKakao } from "../lib/sign-in-with-kakao";

export function KakaoLoginButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={signInWithKakao}
      className={
        className ??
        `${BRUTAL} bg-amber-300 px-4 py-2 text-sm font-extrabold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
      }
    >
      카카오로 로그인
    </button>
  );
}
