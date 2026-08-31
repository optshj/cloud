"use client";

import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { CloudEntry } from "@/entities/cloud-entry";
import { dateKey, getMonthGrid } from "@/shared/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthCalendarGrid({
  year,
  month,
  entries,
  onSelectEntry,
}: {
  year: number;
  month: number;
  entries: CloudEntry[];
  onSelectEntry: (id: string) => void;
}) {
  const todayKey = dateKey(new Date());
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
        // 목업 참고: 사진 있는 날짜만 열마다 번갈아 살짝 기울인 미니 폴라로이드로 표시.
        const tilt = i % 2 === 0 ? "-rotate-2" : "rotate-2";
        const dateLabel = (
          <span className={`text-xs font-bold leading-none ${inMonth ? "text-black" : "text-neutral-300"}`}>
            {date.getDate()}
          </span>
        );

        // 오늘/선택 강조: 연보라 배경 박스 안에 곧게 담기 (기존 방식 유지)
        if (isToday) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => entry && onSelectEntry(entry.id)}
              disabled={!entry}
              aria-label={`${date.getDate()}일${entry ? " 기록 보기" : ""}`}
              className={`flex aspect-square flex-col items-center gap-0.5 border-2 border-black bg-violet-100 p-1 ${
                entry ? "justify-start" : "justify-center"
              }`}
            >
              {dateLabel}
              {entry && (
                <PlaceholderPhoto
                  photoDataUrl={entry.photoDataUrl}
                  placeholderClass={entry.placeholderClass}
                  className="w-full flex-1 border border-black"
                />
              )}
            </button>
          );
        }

        // 사진 없는 날짜: 얇은 테두리로 셀 구분, 숫자만 중앙 정렬
        if (!entry) {
          return (
            <div
              key={key}
              className="flex aspect-square items-center justify-center border border-neutral-300"
            >
              {dateLabel}
            </div>
          );
        }

        // 사진 있는 날짜: 얇은 셀 테두리 위에 굵은 테두리+하드섀도+살짝 회전한 작은 카드가 침범하도록.
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectEntry(entry.id)}
            aria-label={`${date.getDate()}일 기록 보기`}
            className="relative aspect-square border border-neutral-300"
          >
            <span className="absolute -left-0.5 -top-0.5 z-20 text-[11px] font-bold leading-none text-black">
              {date.getDate()}
            </span>
            <PlaceholderPhoto
              photoDataUrl={entry.photoDataUrl}
              placeholderClass={entry.placeholderClass}
              className={`${BRUTAL_SM} absolute -inset-0.5 z-10 bg-white p-0.5 ${tilt}`}
            />
          </button>
        );
      })}
    </div>
  );
}
