import { BRUTAL_SM } from "@/shared/ui/tokens";
import { formatDisplayDate } from "@/shared/lib/date";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";

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
    aria-label={`${entry.location} 기록 보기`}
    className={`${BRUTAL_SM} flex aspect-[4/3] flex-col overflow-hidden bg-white text-left`}
  >
    <PlaceholderPhoto
      photoDataUrl={entry.photoDataUrl}
      placeholderClass={entry.placeholderClass}
      className="min-h-0 w-full flex-1"
    />
    <div className="relative shrink-0 border-t-2 border-black">
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
    </div>
    <div className="min-h-0 flex-1 space-y-1 overflow-hidden bg-amber-50 p-3">
      <p className="font-extrabold">{entry.location}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="line-clamp-2 text-sm text-neutral-700">{entry.comment}</p>
        <p className="whitespace-nowrap text-xs text-neutral-600">
          {formatDisplayDate(entry.date)}
        </p>
      </div>
    </div>
  </button>
);
