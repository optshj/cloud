"use client";

import { useState } from "react";
import { BRUTAL } from "@/shared/ui/tokens";
import { XIcon } from "@/shared/ui/icons";
import { formatDisplayDate } from "@/shared/lib/date";
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
import { buildShareCardDataUrl, downloadDataUrl } from "@/features/share-card";
import type { CloudEntry } from "@/entities/cloud-entry";

// 사진첩 모달 참고 이미지: 그리드에서 날짜를 탭하면 폴라로이드처럼 살짝 기울어진 큰 카드가
// 화면 중앙에 뜨고, 카드 모서리에 겹쳐진 작은 X 버튼으로 닫는다.
// 껍데기(포커스 트랩·Escape·스크롤 잠금·백드롭)는 Radix Dialog가 맡는다.
export const EntryDetailModal = ({
  entry,
  onClose,
  onDelete,
}: {
  entry: CloudEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  const handleSave = async () => {
    if (!entry.photoDataUrl) {
      return;
    }
    const dataUrl = await buildShareCardDataUrl({
      photoDataUrl: entry.photoDataUrl,
      location: entry.location,
      comment: entry.comment,
      displayDate: formatDisplayDate(entry.date),
    });
    downloadDataUrl(dataUrl, `구름-${entry.date}.png`);
  };

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className={`${BRUTAL} -rotate-2 bg-white p-2`}>
        <DialogClose asChild>
          <Button
            variant="thin"
            size="icon"
            aria-label="닫기"
            className="absolute -top-3 -right-3 z-10 rotate-2"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogClose>
        <PlaceholderPhoto
          photoDataUrl={entry.photoDataUrl}
          className="aspect-square w-full border-2 border-black"
        />

        <div className="space-y-1 px-1 pt-3 pb-1">
          <DialogTitle>{entry.location}</DialogTitle>
          <div className="flex items-end justify-between gap-2">
            <DialogDescription>{entry.comment}</DialogDescription>
            <p className="text-xs whitespace-nowrap text-neutral-600">
              {formatDisplayDate(entry.date)}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!entry.photoDataUrl}
            className="mt-2 w-full bg-violet-200 font-extrabold disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
          >
            저장하기
          </Button>
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
    </Dialog>
  );
};
