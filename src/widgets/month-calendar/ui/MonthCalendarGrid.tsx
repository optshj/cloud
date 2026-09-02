"use client";

import { motion } from "framer-motion";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import type { CloudEntry } from "@/entities/cloud-entry";
import { dateKey, getMonthGrid, seoulDateKey } from "@/shared/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 인화한 사진처럼 — 사방에 흰 여백을 두되 아래쪽만 넓게 두고, 그 여백에 날짜를 적는다.
// 사진이 있든 없든 같은 골격을 쓴다: 빈 칸은 "결함"이 아니라 "아직 안 채운 자리"로 읽히고,
// 사진이 도착해도 칸 모양이 바뀌지 않아 레이아웃이 튀지 않는다.
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
  // 하루 1장 제한(CameraView)과 다음 달 잠금(CalendarView)이 전부 KST 기준이다 —
  // 여기만 기기 로컬을 쓰면 비 KST 기기에서 강조되는 "오늘"이 그것들과 다른 날을 가리킨다.
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

        // 지난달·다음달 칸은 대지에 얹지 않는다 — 이번 달만 앨범 페이지다.
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

        // 오늘은 대지 색만 바꾼다(모양은 그대로) — 프레임을 덧대면 인화지 어휘가 깨진다.
        const mount = isToday
          ? "border border-black bg-violet-200"
          : entry
            ? "border border-black/25 bg-white"
            : "border border-black/15 bg-white/55";
        // 날짜 숫자는 달력의 핵심 정보라 대지가 뭐든 AA(4.5:1)를 지킨다.
        // 오늘 칸은 대지가 violet-200이라 neutral-500으로는 3.4:1밖에 안 나온다.
        const dateTone = isToday
          ? "text-neutral-700"
          : entry
            ? "text-neutral-500"
            : "text-neutral-600";
        // 오늘을 색으로만 알리지 않는다 — 스크린리더엔 aria-current, 눈으로는 숫자 굵기.
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

        // 프레임은 이미 자리에 있으니 사진만 그 안에서 나타난다 — 1일 쪽부터 차례로.
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
              <PlaceholderPhoto
                photoDataUrl={entry.photoDataUrl}
                className="absolute inset-0"
              />
            </motion.span>
            <span className={`${DATE_IN_MARGIN} ${dateTone} ${dateWeight}`}>
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
};
