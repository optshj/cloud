"use client";

import { motion } from "framer-motion";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon, XIcon } from "@/shared/ui/icons";
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

// 피드 모달은 사진첩 모달과 달리, 같은 목록의 다른 기록 카드 1~2장을 메인 카드 뒤에
// 부채꼴로 겹쳐 보여주는 "카드 더미" 연출을 쓴다(목업 `피드 모달.png` 기준).
// 카드 더미 + 말풍선을 세로로 쌓아야 해서 DialogContent를 카드가 아니라 래퍼로 쓴다.
export const FeedDetailModal = ({
  entry: openEntry,
  entries,
  onClose,
  onToggleLike,
}: {
  // 열려 있지 않으면 null이다 — 호출부가 조건부 마운트하지 않고 이 prop만 비운다.
  entry: CloudEntry | null;
  entries: CloudEntry[];
  onClose: () => void;
  onToggleLike: () => void;
}) => {
  // 닫히는 동안에도 카드 더미를 계속 그려야 Radix가 exit 애니메이션을 재생한다.
  const entry = useLastNonNull(openEntry);
  const stackEntries = [...entries]
    .filter((e) => e.id !== entry?.id)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2);
  const stackTilts = [
    "rotate-6 translate-x-4 -translate-y-3",
    "-rotate-6 -translate-x-4 translate-y-3",
  ];

  return (
    <Dialog open={openEntry !== null} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {entry && (
        <DialogContent className="flex flex-col items-center gap-3">
          <div className="relative w-full">
            {stackEntries.map((stackEntry, i) => (
              <div
                key={stackEntry.id}
                aria-hidden
                className={`${BRUTAL_SM} absolute inset-0 z-0 flex flex-col overflow-hidden bg-white ${stackTilts[i % stackTilts.length]}`}
              >
                <PlaceholderPhoto
                  photoDataUrl={stackEntry.photoDataUrl}
                  className="aspect-square w-full"
                />
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p className="text-xs text-neutral-600">{stackEntry.location}</p>
                  <p className="text-sm font-extrabold">{stackEntry.tag}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-1">
                    <HeartIcon className="h-4 w-4" />
                    <span className="text-base font-extrabold">{stackEntry.likes}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className={`${BRUTAL} relative z-10 -rotate-1 bg-white p-2`}>
              <DialogClose asChild>
                <Button
                  variant="thin"
                  size="icon"
                  aria-label="닫기"
                  className="absolute -top-3 -right-3 z-20 rotate-2"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </DialogClose>
              {/* 자기 기록은 신고할 수 없다. */}
              {!entry.isMine && (
                <ReportButton
                  entryId={entry.id}
                  className={`${BRUTAL_SM} absolute -top-3 -left-3 z-20 flex h-11 w-11 rotate-2 items-center justify-center bg-white disabled:opacity-50`}
                />
              )}

              <PlaceholderPhoto
                photoDataUrl={entry.photoDataUrl}
                className="aspect-square w-full border-2 border-black"
              />

              <div className="space-y-1 px-1 pt-3 pb-1">
                <DialogTitle className="text-xs font-normal text-neutral-600">
                  {entry.location}
                </DialogTitle>
                <div className="flex items-center justify-between pt-1">
                  <motion.button
                    type="button"
                    onClick={onToggleLike}
                    whileTap={{ scale: 0.85 }}
                    aria-pressed={entry.liked}
                    aria-label={`좋아요 ${entry.likes}개`}
                    className="flex items-center gap-1 text-sm font-bold"
                  >
                    <motion.span
                      // 좋아요를 누른 순간에만 하트가 한 번 팡 튀도록 (취소할 땐 조용히).
                      animate={entry.liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="inline-flex"
                    >
                      <HeartIcon
                        className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`}
                        filled={entry.liked}
                      />
                    </motion.span>
                    {entry.likes}
                  </motion.button>
                  <p className="text-xs text-neutral-600">{formatDisplayDate(entry.date)}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogDescription
            className={`${BRUTAL_SM} relative z-10 -mt-3 w-fit max-w-[85%] rotate-1 rounded-full bg-white px-5 py-2 text-center leading-snug font-extrabold text-neutral-900`}
          >
            {entry.comment}
          </DialogDescription>
        </DialogContent>
      )}
    </Dialog>
  );
};
