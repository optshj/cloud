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
              // key가 없으면 모달이 상시 마운트라(useLastNonNull) 트리 위치가 같아 isReported가
              // 그대로 남는다 — A를 신고하고 닫은 뒤 B를 열면 B가 이미 신고된 것처럼 보이고
              // 버튼이 잠긴다. 기록이 바뀌면 신고 상태도 새로 시작해야 한다.
              key={entry.id}
              entryId={entry.id}
              className={`${BRUTAL_SM} absolute -top-3 -left-3 z-10 flex h-11 w-11 items-center justify-center bg-white disabled:opacity-50`}
            />
          )}

          <PlaceholderPhoto
            photoDataUrl={entry.photoDataUrl}
            alt={`${formatDisplayDate(entry.date)} ${entry.location}에서 기록한 하늘 사진`}
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
            {/* 카드에서 굵게 보이던 그 줄이다 — 격자에는 태그, 상세에는 코멘트만 있어서
                열어보면 다른 글이 뜬 것처럼 보였다. 상세는 카드의 상위집합이어야 한다. */}
            <p className="text-[15px] font-extrabold">{entry.tag}</p>
            <DialogDescription className="text-sm text-neutral-700">
              {entry.comment}
            </DialogDescription>
            <motion.button
              {...HEART_TAP}
              type="button"
              onClick={onToggleLike}
              aria-pressed={entry.liked}
              aria-label={`좋아요 ${entry.likes}개`}
              className="-mx-2 flex min-h-11 items-center gap-1 px-2 pt-1 text-sm font-bold"
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
