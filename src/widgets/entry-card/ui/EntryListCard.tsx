import { BRUTAL_SM } from "@/shared/ui/tokens";
import { formatShortDate } from "@/shared/lib/date";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";
import { tiltClass } from "../lib/tilt";

// 사진첩 목록은 2열 폴라로이드다. 바로 위 달력이 반듯한 격자라 여기까지 반듯하면
// 격자 두 판이 이어져 읽히므로, 카드를 한두 도씩 어긋나게 붙여 대비를 만든다.
// 대지는 흰색이다 — 크림(amber-50)으로 깔아봤더니 2열로 채우는 순간 화면이 누레졌다.
// 앰버는 원래 카드 하단 띠 한 줄에만 쓰던 색이라 대지 전체로 넓히면 안 된다.
// 피드와의 구분은 대지 톤이 아니라 배경 테마(라벤더/코랄)와 하단 정보(날짜·코멘트 vs 태그·좋아요)가 맡는다.
export const EntryListCard = ({
  entry,
  onSelect,
}: {
  entry: CloudEntry;
  onSelect: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(entry.id)}
    aria-label={`${formatShortDate(entry.date)} ${entry.location} 기록 보기`}
    className={`${BRUTAL_SM} ${tiltClass(entry.id)} flex flex-col bg-white p-1.5 pb-2.5 text-left`}
  >
    <PlaceholderPhoto
      photoDataUrl={entry.photoDataUrl}
      className="aspect-square w-full border border-black/20"
    />
    <div className="w-full px-0.5 pt-2">
      <div className="flex items-baseline justify-between gap-1">
        {/* 동 이름이 길면 잘라내고 날짜를 지킨다 — 날짜가 밀려나면 목록을 훑는 기준이 사라진다. */}
        <p className="truncate text-[13px] font-extrabold">{entry.location}</p>
        <p className="shrink-0 text-[10px] text-neutral-600">
          {formatShortDate(entry.date)}
        </p>
      </div>
      <p className="line-clamp-2 text-xs leading-snug text-neutral-700">
        {entry.comment}
      </p>
    </div>
  </button>
);
