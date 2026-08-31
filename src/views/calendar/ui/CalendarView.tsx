"use client";

import { useState } from "react";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { MonthCalendarGrid } from "@/widgets/month-calendar";
import { EntryListCard } from "@/widgets/entry-card";
import { deleteEntryRemote, useCloudEntries } from "@/entities/cloud-entry";

export function CalendarView() {
  const { entries, refresh } = useCloudEntries();
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthEntries = entries
    .filter((e) => {
      const [ey, em] = e.date.split("-").map(Number);
      return ey === year && em === month + 1;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  function goMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  async function handleDelete(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    // 비로그인이거나 남의 글이면 RLS가 막아서 여기선 실패를 조용히 무시하고 그냥 다시 불러온다.
    await deleteEntryRemote(id, entry.date).catch(() => {});
    await refresh();
  }

  return (
    <AppShell theme="calendar">
      <div className="flex items-center justify-between border-b-[3px] border-black px-4 pb-4 pt-4">
        <button type="button" onClick={() => goMonth(-1)} aria-label="이전 달" className={`${BRUTAL_SM} flex h-11 w-11 items-center justify-center bg-white`}>
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-xl font-extrabold">{month + 1}월</p>
          <p className="text-xs text-neutral-500">총 {monthEntries.length}장</p>
        </div>
        <button type="button" onClick={() => goMonth(1)} aria-label="다음 달" className={`${BRUTAL_SM} flex h-11 w-11 items-center justify-center bg-white`}>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <MonthCalendarGrid year={year} month={month} entries={entries} onDelete={handleDelete} />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {monthEntries.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">이 달엔 기록된 구름이 없어요</p>
        )}
        {monthEntries.map((entry) => (
          <EntryListCard key={entry.id} entry={entry} />
        ))}
      </div>
    </AppShell>
  );
}
