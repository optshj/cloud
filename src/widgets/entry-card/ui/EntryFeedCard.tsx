import { BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";

export const EntryFeedCard = ({
  entry,
  onSelect,
  onToggleLike,
}: {
  entry: CloudEntry;
  onSelect: (id: string) => void;
  onToggleLike: (id: string) => void;
}) => (
  <div className={`${BRUTAL_SM} flex flex-col overflow-hidden bg-white`}>
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-label={`${entry.location} 기록 보기`}
      className="block text-left"
    >
      <PlaceholderPhoto
        photoDataUrl={entry.photoDataUrl}
        placeholderClass={entry.placeholderClass}
        className="aspect-square w-full"
      />
    </button>
    <div className="flex flex-1 flex-col gap-1 p-2">
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        className="text-left"
      >
        <p className="text-xs text-neutral-600">{entry.location}</p>
        <p className="text-sm font-extrabold">{entry.tag}</p>
      </button>
      <button
        type="button"
        onClick={() => onToggleLike(entry.id)}
        aria-pressed={entry.liked}
        // 상태는 aria-pressed가 알린다 — 라벨까지 상태를 담으면 이중 안내가 되고,
        // 라벨이 버튼 내용을 덮어써서 좋아요 수가 안 읽힌다.
        aria-label={`좋아요 ${entry.likes}개`}
        className="mt-auto flex items-center gap-1.5 pt-1"
      >
        <HeartIcon
          className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`}
          filled={entry.liked}
        />
        <span className="text-base font-extrabold">{entry.likes}</span>
      </button>
    </div>
  </div>
);
