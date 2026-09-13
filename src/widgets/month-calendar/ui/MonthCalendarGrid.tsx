"use client";

import { motion } from "framer-motion";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";
import { dateKey, getMonthGrid, seoulDateKey } from "@/shared/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const PRINT = "aspect-square p-[2px] pb-[11px]";
const PHOTO_AREA = "absolute inset-[2px] bottom-[11px]";
const DATE_IN_MARGIN = "absolute inset-x-0 bottom-px text-[10px] leading-none";

export const MonthCalendarGrid = ({
  year,
  month,
  entries,
  onSelectEntry,
}: {
  year: number;
  month: number;
  entries: CloudEntry[];
  onSelectEntry: (id: string) => void;
}) => {
  // KST — 하루 1장 제한·다음 달 잠금과 같은 "오늘"을 가리키게.
  const todayKey = seoulDateKey();
  const grid = getMonthGrid(year, month);
  const entryByDate = new Map(entries.map((e) => [e.date, e]));

  return (
    <div className="grid grid-cols-7 gap-1 p-4 text-center text-xs">
      {WEEKDAYS.map((w) => (
        <div key={w} className="pb-1 font-bold text-black">
          {w}
        </div>
      ))}
      {grid.map(({ date, inMonth }, i) => {
        const key = dateKey(date);
        const entry = inMonth ? entryByDate.get(key) : undefined;
        const isToday = key === todayKey;

        if (!inMonth) {
          return (
            <div
              key={key}
              className="flex aspect-square items-center justify-center text-[10px] font-bold text-black/20"
            >
              {date.getDate()}
            </div>
          );
        }

        const mount = isToday
          ? "border border-black bg-violet-200"
          : entry
            ? "border border-black/25 bg-white"
            : "border border-black/15 bg-white/55";
        // 대지별로 AA(4.5:1) — violet-200 위 neutral-500은 3.4:1이다.
        const dateTone = isToday
          ? "text-neutral-700"
          : entry
            ? "text-neutral-500"
            : "text-neutral-600";
        const dateWeight = isToday ? "font-extrabold" : "font-bold";

        if (!entry) {
          return (
            <div
              key={key}
              aria-current={isToday ? "date" : undefined}
              className={`relative ${PRINT} ${mount}`}
            >
              <span className={`${PHOTO_AREA} block bg-black/[0.06]`} />
              <span className={`${DATE_IN_MARGIN} ${dateTone} ${dateWeight}`}>
                {date.getDate()}
              </span>
            </div>
          );
        }

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectEntry(entry.id)}
            aria-label={`${date.getDate()}일 기록 보기`}
            aria-current={isToday ? "date" : undefined}
            className={`relative ${PRINT} ${mount} shadow-[1px_1px_0_0_rgba(0,0,0,0.28)] ${
              i % 2 === 0 ? "-rotate-1" : "rotate-1"
            }`}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.24,
                ease: "easeOut",
                delay: Math.min(i * 0.015, 0.5),
              }}
              className={`${PHOTO_AREA} block`}
            >
              <PlaceholderPhoto photoDataUrl={entry.photoDataUrl} className="absolute inset-0" />
            </motion.span>
            <span className={`${DATE_IN_MARGIN} ${dateTone} ${dateWeight}`}>{date.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
};
