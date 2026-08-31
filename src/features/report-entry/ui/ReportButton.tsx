"use client";

import { useState } from "react";
import { FlagIcon } from "@/shared/ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { reportEntryRemote } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";

export const ReportButton = ({
  entryId,
  className,
}: {
  entryId: string;
  className?: string;
}) => {
  const { user } = useSession();
  const [isReported, setIsReported] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = () => {
    if (!user) {
      signInWithKakao();
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsReported(true);
    try {
      await reportEntryRemote(entryId);
    } catch (err) {
      console.error("report-entry: 신고 접수 요청 실패", entryId, err);
      setIsReported(false);
      setErrorMessage("신고 접수에 실패했어요. 로그인 상태를 확인해주세요.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isReported}
        aria-label="신고"
        className={className}
      >
        <FlagIcon className="h-4 w-4" />
      </button>
      {isReported && (
        <span
          role="status"
          className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-3 py-1 text-xs font-bold text-white"
        >
          신고가 접수되었어요
        </span>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>이 게시물을 신고할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            신고가 쌓이면 이 기록은 피드에서 자동으로 숨겨져요.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              신고하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={errorMessage !== null}
        onOpenChange={() => setErrorMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>신고를 접수하지 못했어요</AlertDialogTitle>
          <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          <AlertDialogFooter className="grid-cols-1">
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
