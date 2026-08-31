"use client";

import { useState } from "react";
import { FlagIcon } from "@/shared/ui/icons";
import { reportEntryRemote } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";

export function ReportButton({ entryId, className }: { entryId: string; className?: string }) {
  const { user } = useSession();
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (!user) return signInWithKakao();
    if (!window.confirm("이 게시물을 신고할까요?")) return;
    setReported(true);
    try {
      await reportEntryRemote(entryId);
    } catch {
      setReported(false);
      window.alert("신고 접수에 실패했어요. 로그인 상태를 확인해주세요.");
    }
  }

  return (
    <>
      <button type="button" onClick={handleReport} disabled={reported} aria-label="신고" className={className}>
        <FlagIcon className="h-4 w-4" />
      </button>
      {reported && (
        <span className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          신고가 접수되었어요
        </span>
      )}
    </>
  );
}
