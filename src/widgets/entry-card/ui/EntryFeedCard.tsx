import { BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { CloudEntry } from "@/entities/cloud-entry";

export function EntryFeedCard({
  entry,
  index,
  onSelect,
  onToggleLike,
}: {
  entry: CloudEntry;
  index: number;
  onSelect: (id: string) => void;
  onToggleLike: (id: string) => void;
}) {
  return (
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
          className="mt-auto flex items-center gap-1.5 pt-1"
        >
          <HeartIcon className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`} filled={entry.liked} />
          <span className="text-base font-extrabold">{entry.likes}</span>
        </button>
      </div>
    </div>
  );
}
