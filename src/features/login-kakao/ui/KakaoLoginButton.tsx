"use client";

import { Button } from "@/shared/ui/button";
import { signInWithKakao } from "../lib/sign-in-with-kakao";

export const KakaoLoginButton = ({ className }: { className?: string }) => (
  <Button onClick={signInWithKakao} className={`bg-amber-300 font-extrabold ${className ?? ""}`}>
    카카오로 로그인
  </Button>
);
