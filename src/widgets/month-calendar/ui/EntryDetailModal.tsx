"use client";

import { useState } from "react";
import { BRUTAL } from "@/shared/ui/tokens";
import { Heart, X } from "lucide-react";
import { formatDisplayDate } from "@/shared/lib/date";
import { useLastNonNull } from "@/shared/lib/use-last-non-null";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { downloadEntryImage } from "@/features/share-card";
import type { DownloadKind } from "@/features/share-card";
import type { CloudEntry } from "@/entities/cloud-entry";
import { toast } from "sonner";

export const EntryDetailModal = ({
  entry: openEntry,
  onClose,
  onDelete,
}: {
  entry: CloudEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState<DownloadKind | null>(null);
  const entry = useLastNonNull(openEntry);

  const handleClose = () => {
    // 상시 마운트라 확인창 상태가 남는다 — 같이 접는다.
    setIsDeleteOpen(false);
    onClose();
  };

  const handleDelete = () => {
    if (entry) {
      onDelete(entry.id);
    }
    handleClose();
  };

  const handleDownload = async (kind: DownloadKind) => {
    if (!entry?.photoDataUrl) {
      return;
    }
    setDownloading(kind);
    try {
      await downloadEntryImage(kind, {
        photoDataUrl: entry.photoDataUrl,
        location: entry.location,
        comment: entry.comment,
        dateKey: entry.date,
      });
    } catch (err) {
      console.error(
        `calendar: ${kind === "card" ? "공유카드" : "원본 사진"} 다운로드 실패`,
        entry.id,
        err,
      );
      toast.error(
        kind === "card"
          ? "카드 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요."
          : "원본 사진을 받지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog
      open={openEntry !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
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
            <p className="flex min-h-11 items-center gap-1 pt-1 text-sm font-bold">
              <Heart className="h-4 w-4 text-black" />
              <span className="sr-only">좋아요</span>
              {entry.likes}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => handleDownload("original")}
                disabled={!entry.photoDataUrl || downloading !== null}
                aria-busy={downloading === "original"}
                className="bg-violet-100 font-extrabold disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
              >
                {downloading === "original" ? "받는 중..." : "원본 저장"}
              </Button>
              <Button
                onClick={() => handleDownload("card")}
                disabled={!entry.photoDataUrl || downloading !== null}
                aria-busy={downloading === "card"}
                className="bg-violet-200 font-extrabold disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
              >
                {downloading === "card" ? "만드는 중..." : "카드 저장"}
              </Button>
            </div>
            <Button
              variant="link"
              size="none"
              onClick={() => setIsDeleteOpen(true)}
              className="min-h-11 w-full text-center text-xs text-neutral-500"
            >
              삭제하기
            </Button>
          </div>

          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogTitle>이 기록을 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                {formatDisplayDate(entry.date)}에 기록한 사진과 코멘트가 함께 지워져요. 되돌릴 수
                없어요.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  삭제하기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      )}
    </Dialog>
  );
};
