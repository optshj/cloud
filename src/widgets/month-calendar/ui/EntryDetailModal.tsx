"use client";

import { useState } from "react";
import { BRUTAL } from "@/shared/ui/tokens";
import { X } from "lucide-react";
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
import { buildShareCardDataUrl, downloadDataUrl } from "@/features/share-card";
import type { CloudEntry } from "@/entities/cloud-entry";
import { toast } from "sonner";

// 사진첩 모달 참고 이미지: 그리드에서 날짜를 탭하면 폴라로이드처럼 살짝 기울어진 큰 카드가
// 화면 중앙에 뜨고, 카드 모서리에 겹쳐진 작은 X 버튼으로 닫는다.
// 껍데기(포커스 트랩·Escape·스크롤 잠금·백드롭)는 Radix Dialog가 맡는다.
export const EntryDetailModal = ({
  entry: openEntry,
  onClose,
  onDelete,
}: {
  // 열려 있지 않으면 null이다 — 호출부가 조건부 마운트하지 않고 이 prop만 비운다.
  entry: CloudEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // 닫히는 동안에도 카드를 계속 그려야 Radix가 exit 애니메이션을 재생한다.
  const entry = useLastNonNull(openEntry);

  const handleClose = () => {
    // 모달이 언마운트되지 않으므로 확인창 상태가 살아남는다 — 다음에 열 때 바로 뜨지 않게 같이 접는다.
    setIsDeleteOpen(false);
    onClose();
  };

  const handleDelete = () => {
    if (entry) {
      onDelete(entry.id);
    }
    handleClose();
  };

  const handleSave = async () => {
    if (!entry?.photoDataUrl) {
      return;
    }
    setIsSaving(true);
    try {
      const dataUrl = await buildShareCardDataUrl({
        photoDataUrl: entry.photoDataUrl,
        location: entry.location,
        comment: entry.comment,
        displayDate: formatDisplayDate(entry.date),
      });
      downloadDataUrl(dataUrl, `구름-${entry.date}.png`);
    } catch (err) {
      console.error("calendar: 공유카드 생성 실패", entry.id, err);
      toast.error("카드 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
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

          {/* 캡션 구성은 피드 상세(FeedDetailModal)와 같다 — 같은 기록을 어디서 열든
              같은 순서로 읽혀야 한다: 위치·날짜 / 태그 / 코멘트. */}
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
            <Button
              onClick={handleSave}
              disabled={!entry.photoDataUrl || isSaving}
              aria-busy={isSaving}
              className="mt-2 w-full bg-violet-200 font-extrabold disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
            >
              {isSaving ? "만드는 중..." : "저장하기"}
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
      )}
    </Dialog>
  );
};
