"use client";

import { motion } from "framer-motion";
import { BRUTAL_SM, HEART_POP, HEART_TAP, PRESS } from "@/shared/ui/tokens";
import { Heart } from "lucide-react";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { formatDisplayDate } from "@/shared/lib/date";
import type { CloudEntry } from "@/entities/cloud-entry";
import { tiltClass } from "../lib/tilt";

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
    className={`${BRUTAL_SM} ${PRESS} ${tiltClass(entry.id)} flex flex-col bg-white p-1.5 pb-2.5`}
  >
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-label={`${formatDisplayDate(entry.date)} ${entry.location} 기록 보기`}
      className="block text-left"
    >
      <PlaceholderPhoto
        photoDataUrl={entry.photoDataUrl}
        className="aspect-square w-full border border-black/20"
      />
    </button>
    <div className="flex flex-1 flex-col px-0.5 pt-2">
      <button type="button" onClick={() => onSelect(entry.id)} className="text-left">
        <p className="truncate text-[10px] text-neutral-600">{entry.location}</p>
        <p className="text-[13px] font-extrabold">{entry.tag}</p>
      </button>
      {entry.isMine ? (
        <p className="mt-auto -mb-2 flex min-h-11 w-fit items-center gap-1.5 pt-1">
          <Heart className="h-4 w-4 text-black" />
          <span className="sr-only">좋아요</span>
          <span className="text-base font-extrabold">{entry.likes}</span>
        </p>
      ) : (
        <motion.button
          {...HEART_TAP}
          type="button"
          onClick={() => onToggleLike(entry.id)}
          aria-pressed={entry.liked}
          aria-label={`좋아요 ${entry.likes}개`}
          className="-mx-2 mt-auto -mb-2 flex min-h-11 w-fit items-center gap-1.5 px-2 pt-1"
        >
          <motion.span
            {...HEART_POP}
            animate={entry.liked ? "popped" : "idle"}
            className="inline-flex"
          >
            <Heart
              className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`}
              fill={entry.liked ? "currentColor" : "none"}
            />
          </motion.span>
          <span className="text-base font-extrabold">{entry.likes}</span>
        </motion.button>
      )}
    </div>
  </div>
);
