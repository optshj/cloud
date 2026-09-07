"use client";

import { motion } from "framer-motion";
import { BRUTAL, BRUTAL_SM, HEART_POP, HEART_TAP } from "@/shared/ui/tokens";
import { Heart, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { formatDisplayDate } from "@/shared/lib/date";
import { ReportButton } from "@/features/report-entry";
import type { CloudEntry } from "@/entities/cloud-entry";
import { useLastNonNull } from "@/shared/lib/use-last-non-null";

// 사진첩 모달(EntryDetailModal)과 같은 골격 — 살짝 기울어진 폴라로이드 카드 한 장 +
// 모서리에 겹쳐진 X 버튼. 껍데기(포커스 트랩·Escape·스크롤 잠금·백드롭)는 Radix Dialog가 맡는다.
export const FeedDetailModal = ({
  entry: openEntry,
  onClose,
  onToggleLike,
}: {
  // 열려 있지 않으면 null이다 — 호출부가 조건부 마운트하지 않고 이 prop만 비운다.
  entry: CloudEntry | null;
  onClose: () => void;
  onToggleLike: () => void;
}) => {
  // 닫히는 동안에도 카드를 계속 그려야 Radix가 exit 애니메이션을 재생한다.
  const entry = useLastNonNull(openEntry);

  return (
    <Dialog open={openEntry !== null} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {entry && (
        <DialogContent className={`${BRUTAL} -rotate-2 bg-white p-2`}>
          <DialogClose asChild>
            <Button
              variant="thin"
              size="icon"
              aria-label="닫기"
              className="absolute -top-3 -right-3 z-10 bg-rose-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          {/* 자기 기록은 신고할 수 없다. */}
          {!entry.isMine && (
            <ReportButton
              entryId={entry.id}
              className={`${BRUTAL_SM} absolute -top-3 -left-3 z-10 flex h-11 w-11 items-center justify-center bg-white disabled:opacity-50`}
            />
          )}

          <PlaceholderPhoto
            photoDataUrl={entry.photoDataUrl}
            className="aspect-square w-full border-2 border-black"
          />

          <div className="space-y-1 px-1 pt-3 pb-1">
            <div className="flex items-end justify-between gap-2">
              <DialogTitle className="text-xs font-normal text-neutral-600">
                {entry.location}
              </DialogTitle>
              <p className="text-xs whitespace-nowrap text-neutral-600">
                {formatDisplayDate(entry.date)}
              </p>
            </div>
            <DialogDescription className="pt-1 text-sm font-bold text-neutral-900">
              {entry.comment}
            </DialogDescription>
            <motion.button
              {...HEART_TAP}
              type="button"
              onClick={onToggleLike}
              aria-pressed={entry.liked}
              aria-label={`좋아요 ${entry.likes}개`}
              className="flex items-center gap-1 pt-1 text-sm font-bold"
            >
              <motion.span
                {...HEART_POP}
                animate={entry.liked ? "popped" : "idle"}
                className="inline-flex"
              >
                <Heart
                  className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`}
                  fill={entry.liked ? "currentColor" : "none"}
                />
              </motion.span>
              {entry.likes}
            </motion.button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
