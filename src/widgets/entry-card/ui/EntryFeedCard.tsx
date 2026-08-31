import Link from "next/link";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { CloudEntry } from "@/entities/cloud-entry";

export function EntryFeedCard({
  entry,
  index,
  onToggleLike,
}: {
  entry: CloudEntry;
  index: number;
  onToggleLike: (id: string) => void;
}) {
  return (
    <div className={`${BRUTAL_SM} flex flex-col overflow-hidden bg-white`}>
      <Link href={`/feed/${entry.id}`} className="block">
        <PlaceholderPhoto
          photoDataUrl={entry.photoDataUrl}
          placeholderClass={entry.placeholderClass}
          className="aspect-square w-full"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <Link href={`/feed/${entry.id}`}>
          <p className="text-xs text-neutral-600">{entry.location}</p>
          <p className="text-sm font-extrabold">{entry.tag}</p>
        </Link>
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
