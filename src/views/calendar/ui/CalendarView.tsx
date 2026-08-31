"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/widgets/app-shell";
import { LIST_CONTAINER, LIST_ITEM } from "@/shared/ui/tokens";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { EntryDetailModal, MonthCalendarGrid } from "@/widgets/month-calendar";
import { EntryListCard, EntryListCardSkeleton } from "@/widgets/entry-card";
import { deleteEntryRemote, useCloudEntries } from "@/entities/cloud-entry";

export const CalendarView = () => {
  const { entries, loading: isLoading, error, refresh } = useCloudEntries();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthEntries = entries
    .filter((e) => {
      const [ey, em] = e.date.split("-").map(Number);
      return ey === year && em === month + 1;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const goMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const handleDelete = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) {
      return;
    }
    // 비로그인이거나 남의 글이면 RLS가 막아서 여기선 실패를 조용히 무시하고 그냥 다시 불러온다.
    await deleteEntryRemote(id, entry.date).catch((err) => {
      console.error("calendar: 기록 삭제 실패", id, entry.date, err);
    });
    await refresh();
  };

  return (
    <AppShell theme="calendar" title="사진첩">
      <div className="flex items-center justify-between border-b-[3px] border-black px-4 pb-4 pt-4">
        <Button
          variant="thin"
          size="icon"
          onClick={() => goMonth(-1)}
          aria-label="이전 달"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-xl font-extrabold">{month + 1}월</p>
          {/* 조회가 끝나기 전엔 "총 0장"이 잠깐 사실인 것처럼 보인다 — 개수는 도착한 뒤에만 쓴다. */}
          <p className="text-xs text-neutral-500">
            {isLoading ? "불러오는 중..." : `총 ${monthEntries.length}장`}
          </p>
        </div>
        <Button
          variant="thin"
          size="icon"
          onClick={() => goMonth(1)}
          aria-label="다음 달"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <MonthCalendarGrid
        year={year}
        month={month}
        entries={entries}
        onSelectEntry={setSelectedId}
      />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {isLoading && (
          <div
            className="flex flex-col gap-4"
            aria-busy="true"
            aria-label="사진첩 불러오는 중"
          >
            {Array.from({ length: 2 }).map((_, index) => (
              <EntryListCardSkeleton key={index} />
            ))}
          </div>
        )}
        {!isLoading && error && (
          <p
            role="alert"
            className="py-8 text-center text-sm font-bold text-rose-600"
          >
            {error}
          </p>
        )}
        {!isLoading && !error && monthEntries.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">
            이 달엔 기록된 구름이 없어요
          </p>
        )}
        {!isLoading && !error && monthEntries.length > 0 && (
          <motion.div
            {...LIST_CONTAINER}
            key={`${year}-${month}`}
            className="flex flex-col gap-4"
          >
            {monthEntries.map((entry) => (
              <motion.div key={entry.id} {...LIST_ITEM} className="grid">
                <EntryListCard entry={entry} onSelect={setSelectedId} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
        />
      )}
    </AppShell>
  );
};
