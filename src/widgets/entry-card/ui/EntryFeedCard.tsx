import { BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";
import { tiltClass } from "../lib/tilt";

// 사진첩과 같은 폴라로이드 어휘. 대지는 흰색이고 아래엔 날짜 대신 태그·좋아요가 온다 —
// 두 탭이 같은 2열 격자라 대지 톤과 메타 정보로 구분한다.
export const EntryFeedCard = ({
  entry,
  onSelect,
  onToggleLike,
}: {
  entry: CloudEntry;
  onSelect: (id: string) => void;
  onToggleLike: (id: string) => void;
}) => (
  <div
    className={`${BRUTAL_SM} ${tiltClass(entry.id)} flex flex-col bg-white p-1.5 pb-2.5`}
  >
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-label={`${entry.location} 기록 보기`}
      className="block text-left"
    >
      <PlaceholderPhoto
        photoDataUrl={entry.photoDataUrl}
        placeholderClass={entry.placeholderClass}
        className="aspect-square w-full border border-black/20"
      />
    </button>
    <div className="flex flex-1 flex-col px-0.5 pt-2">
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        className="text-left"
      >
        <p className="truncate text-[10px] text-neutral-600">
          {entry.location}
        </p>
        <p className="text-[13px] font-extrabold">{entry.tag}</p>
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
