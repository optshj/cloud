import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { XIcon } from "@/shared/ui/icons";
import { formatDisplayDate } from "@/shared/lib/date";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { buildShareCardDataUrl, downloadDataUrl } from "@/features/share-card";
import { ReportButton } from "@/features/report-entry";
import { CloudEntry } from "@/entities/cloud-entry";

// 사진첩 모달 참고 이미지: 그리드에서 날짜를 탭하면 폴라로이드처럼 살짝 기울어진 큰 카드가
// 화면 중앙에 뜨고, 카드 모서리에 겹쳐진 작은 X 버튼으로 닫는다.
export function EntryDetailModal({
  entry,
  onClose,
  onDelete,
}: {
  entry: CloudEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  function handleDelete() {
    if (window.confirm("이 기록을 삭제할까요?")) {
      onDelete(entry.id);
      onClose();
    }
  }

  async function handleSave() {
    if (!entry.photoDataUrl) return;
    const dataUrl = await buildShareCardDataUrl({
      photoDataUrl: entry.photoDataUrl,
      location: entry.location,
      comment: entry.comment,
      displayDate: formatDisplayDate(entry.date),
    });
    downloadDataUrl(dataUrl, `구름-${entry.date}.png`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className={`${BRUTAL} relative w-full max-w-xs -rotate-2 bg-white p-2`}
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={`${BRUTAL_SM} absolute -right-3 -top-3 z-10 flex h-9 w-9 rotate-2 items-center justify-center bg-white`}
        >
          <XIcon className="h-4 w-4" />
        </button>
        <ReportButton
          entryId={entry.id}
          className={`${BRUTAL_SM} absolute -left-3 -top-3 z-10 flex h-9 w-9 rotate-2 items-center justify-center bg-white disabled:opacity-50`}
        />

        <PlaceholderPhoto
          photoDataUrl={entry.photoDataUrl}
          placeholderClass={entry.placeholderClass}
          className="aspect-square w-full border-2 border-black"
        />

        <div className="space-y-1 px-1 pb-1 pt-3">
          <p className="font-extrabold">{entry.location}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-sm text-neutral-700">{entry.comment}</p>
            <p className="whitespace-nowrap text-xs text-neutral-600">{formatDisplayDate(entry.date)}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!entry.photoDataUrl}
            className={`${BRUTAL} mt-2 w-full bg-violet-200 py-2 text-sm font-extrabold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400`}
          >
            저장하기
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full pt-1 text-center text-xs font-bold text-neutral-400 underline underline-offset-2"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
