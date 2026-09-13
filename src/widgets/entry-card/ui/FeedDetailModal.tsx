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

export const FeedDetailModal = ({
  entry: openEntry,
  onClose,
  onToggleLike,
}: {
  entry: CloudEntry | null;
  onClose: () => void;
  onToggleLike: () => void;
}) => {
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
          {!entry.isMine && (
            <ReportButton
              // 상시 마운트라 key가 없으면 이전 기록의 신고 상태가 남는다.
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
            <p className="text-[15px] font-extrabold">{entry.tag}</p>
            <DialogDescription className="text-sm text-neutral-700">
              {entry.comment}
            </DialogDescription>
            {entry.isMine ? (
              <p className="flex min-h-11 items-center gap-1 pt-1 text-sm font-bold">
                <Heart className="h-4 w-4 text-black" />
                <span className="sr-only">좋아요</span>
                {entry.likes}
              </p>
            ) : (
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
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
