"use client";

import { motion } from "framer-motion";
import { BRUTAL_SM, HEART_POP, HEART_TAP, PRESS } from "@/shared/ui/tokens";
import { Heart } from "lucide-react";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { formatDisplayDate } from "@/shared/lib/date";
import type { CloudEntry } from "@/entities/cloud-entry";
import { tiltClass } from "../lib/tilt";

// 피드와 사진첩이 같이 쓰는 카드다. 원래 사진첩은 EntryListCard(날짜+코멘트, 좋아요 없음)를
// 따로 들고 있었는데, 같은 기록이 탭마다 다르게 읽히고 사진첩에선 좋아요 수를 볼 수 없었다 —
// 카드를 하나로 합치고 두 탭의 구분은 배경 테마(라벤더/코랄)에 맡긴다.
// 대지는 흰색이다 — 크림(amber-50)으로 깔아봤더니 2열로 채우는 순간 화면이 누레졌다.
export const EntryFeedCard = ({
  entry,
  onSelect,
  onToggleLike,
}: {
  entry: CloudEntry;
  onSelect: (id: string) => void;
  onToggleLike: (id: string) => void;
}) => (
  // 섀도가 이 대지에 걸려 있어서 눌림도 여기서 낸다 — :active는 조상까지 걸리므로
  // 안쪽 어느 버튼을 눌러도 카드가 같이 눌린다.
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
      <motion.button
        {...HEART_TAP}
        type="button"
        onClick={() => onToggleLike(entry.id)}
        aria-pressed={entry.liked}
        // 상태는 aria-pressed가 알린다 — 라벨까지 상태를 담으면 이중 안내가 되고,
        // 라벨이 버튼 내용을 덮어써서 좋아요 수가 안 읽힌다.
        aria-label={`좋아요 ${entry.likes}개`}
        // 아이콘만큼(~20px)이던 히트 영역을 44px로 — 카드 안이라 음수 마진으로 여백만 먹인다.
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
    </div>
  </div>
);
