import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon, XIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { formatDisplayDate } from "@/shared/lib/date";
import { ReportButton } from "@/features/report-entry";
import type { CloudEntry } from "@/entities/cloud-entry";

// 피드 모달은 사진첩 모달과 달리, 같은 목록의 다른 기록 카드 1~2장을 메인 카드 뒤에
// 부채꼴로 겹쳐 보여주는 "카드 더미" 연출을 쓴다(목업 `피드 모달.png` 기준).
export const FeedDetailModal = ({
  entry,
  entries,
  onClose,
  onToggleLike,
}: {
  entry: CloudEntry;
  entries: CloudEntry[];
  onClose: () => void;
  onToggleLike: () => void;
}) => {
  const stackEntries = [...entries]
    .filter((e) => e.id !== entry.id)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2);
  const stackTilts = [
    "rotate-6 translate-x-4 -translate-y-3",
    "-rotate-6 -translate-x-4 translate-y-3",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/50 p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs"
        onClick={(ev) => ev.stopPropagation()}
      >
        {stackEntries.map((stackEntry, i) => (
          <div
            key={stackEntry.id}
            aria-hidden
            className={`${BRUTAL_SM} absolute inset-0 z-0 flex flex-col overflow-hidden bg-white ${stackTilts[i % stackTilts.length]}`}
          >
            <PlaceholderPhoto
              photoDataUrl={stackEntry.photoDataUrl}
              placeholderClass={stackEntry.placeholderClass}
              className="aspect-square w-full"
            />
            <div className="flex flex-1 flex-col gap-1 p-2">
              <p className="text-xs text-neutral-600">{stackEntry.location}</p>
              <p className="text-sm font-extrabold">{stackEntry.tag}</p>
              <div className="mt-auto flex items-center gap-1.5 pt-1">
                <HeartIcon className="h-4 w-4" />
                <span className="text-base font-extrabold">
                  {stackEntry.likes}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className={`${BRUTAL} relative z-10 -rotate-1 bg-white p-2`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className={`${BRUTAL_SM} absolute -right-3 -top-3 z-20 flex h-9 w-9 rotate-2 items-center justify-center bg-white`}
          >
            <XIcon className="h-4 w-4" />
          </button>
          <ReportButton
            entryId={entry.id}
            className={`${BRUTAL_SM} absolute -left-3 -top-3 z-20 flex h-9 w-9 rotate-2 items-center justify-center bg-white disabled:opacity-50`}
          />

          <PlaceholderPhoto
            photoDataUrl={entry.photoDataUrl}
            placeholderClass={entry.placeholderClass}
            className="aspect-square w-full border-2 border-black"
          />

          <div className="space-y-1 px-1 pb-1 pt-3">
            <p className="text-xs text-neutral-600">{entry.location}</p>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onToggleLike}
                className="flex items-center gap-1 text-sm font-bold"
              >
                <HeartIcon
                  className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`}
                  filled={entry.liked}
                />
                {entry.likes}
              </button>
              <p className="text-xs text-neutral-600">
                {formatDisplayDate(entry.date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${BRUTAL_SM} relative z-10 -mt-3 w-fit max-w-[85%] rotate-1 rounded-full bg-white px-5 py-2 text-center text-sm font-extrabold leading-snug`}
        onClick={(ev) => ev.stopPropagation()}
      >
        {entry.comment}
      </div>
    </div>
  );
};
