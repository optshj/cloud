"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, usePageReady } from "@/widgets/app-shell";
import { BRUTAL, BRUTAL_SM, LIST_CONTAINER, LIST_ITEM } from "@/shared/ui/tokens";
import { Camera, ChevronLeft, ChevronRight, Cloud } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EntryDetailModal, MonthCalendarGrid } from "@/widgets/month-calendar";
import { EntryFeedCard } from "@/widgets/entry-card";
import { deleteEntryRemote, useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { dateKey, seoulDateKey } from "@/shared/lib/date";
import { toast } from "sonner";

export const CalendarView = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const { entries: allEntries, isLoading, error, refresh, toggleLike } = useCloudEntries();
  usePageReady(!isLoading && !isSessionLoading);
  const entries = allEntries.filter((e) => e.isMine);
  // KST 기준 — 기기 로컬이면 월말 자정 근처에 isThisMonth와 어긋난다.
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = seoulDateKey().split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const isThisYear = year === Number(seoulDateKey().slice(0, 4));
  const isThisMonth = seoulDateKey().slice(0, 7) === dateKey(viewDate).slice(0, 7);
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
    await deleteEntryRemote(id).catch((err) => {
      console.error("calendar: 기록 삭제 실패", id, entry.date, err);
      toast.error("기록을 지우지 못했어요. 잠시 후 다시 시도해주세요.");
    });
    await refresh();
  };

  // 세션도 기다린다 — 안 그러면 로그인 사용자에게 로그인 버튼이 깜빡인다.
  if (isLoading || isSessionLoading) {
    return (
      <AppShell theme="calendar" title="사진첩">
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          role="status"
          aria-label="사진첩 불러오는 중"
        >
          <div className={`cloud-bob ${BRUTAL} bg-white p-4`}>
            <Cloud className="h-10 w-10 text-violet-300" fill="currentColor" strokeWidth={0} />
          </div>
          <p className={`${BRUTAL_SM} bg-white px-3 py-1 text-xs font-bold`}>구름 모으는 중...</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell theme="calendar" title="사진첩">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8">
          <div className={`${BRUTAL} -rotate-2 bg-white p-2 pb-6`}>
            <div className="flex h-28 w-28 items-center justify-center border border-dashed border-black/25 bg-violet-50">
              <Cloud className="h-10 w-10 text-violet-200" fill="currentColor" strokeWidth={0} />
            </div>
          </div>
          <p className="text-sm font-bold text-neutral-500">
            로그인하면 내가 찍은 구름을 볼 수 있어요
          </p>
          <KakaoLoginButton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="calendar" title="사진첩">
      <motion.div {...LIST_CONTAINER} className="flex flex-col">
        <motion.div
          {...LIST_ITEM}
          className="flex items-center justify-between border-b-[3px] border-black px-4 pt-4 pb-4"
        >
          <Button
            variant="thin"
            size="icon"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="rotate-2"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.75} />
          </Button>
          <div className={`${BRUTAL_SM} -rotate-2 bg-white px-5 pt-1.5 pb-2 text-center`}>
            <p className="text-xl leading-tight font-extrabold">{month + 1}월</p>
            <p className="text-[11px] text-neutral-500">
              {isThisYear ? "" : `${year}년 · `}
              {error ? "기록을 못 불러왔어요" : `${monthEntries.length}장 기록`}
            </p>
          </div>
          <Button
            variant="thin"
            size="icon"
            onClick={() => goMonth(1)}
            disabled={isThisMonth}
            aria-label="다음 달"
            className="-rotate-2"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.75} />
          </Button>
        </motion.div>

        <motion.div {...LIST_ITEM}>
          <MonthCalendarGrid
            year={year}
            month={month}
            entries={entries}
            onSelectEntry={setSelectedId}
          />
        </motion.div>

        <div className="flex flex-col gap-4 px-4 pb-24">
          {error && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p role="alert" className="text-center text-sm font-bold text-rose-600">
                {error}
              </p>
              <Button onClick={() => refresh()}>다시 시도</Button>
            </div>
          )}
          {!error && monthEntries.length === 0 && (
            <motion.div {...LIST_ITEM} className="flex flex-col items-center gap-3 py-8">
              <div className={`${BRUTAL} -rotate-2 bg-white p-2 pb-6`}>
                <div className="flex h-28 w-28 items-center justify-center border border-dashed border-black/25 bg-violet-50">
                  <Cloud
                    className="h-10 w-10 text-violet-200"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </div>
              </div>
              <p className="text-sm font-bold text-neutral-500">이 달엔 기록된 구름이 없어요</p>
              {isThisMonth && (
                <Button asChild size="sm" className="bg-violet-100">
                  <Link href="/">
                    <Camera className="h-4 w-4" />
                    오늘 하늘 찍기
                  </Link>
                </Button>
              )}
            </motion.div>
          )}
          {!error && monthEntries.length > 0 && (
            <motion.div
              {...LIST_CONTAINER}
              key={`${year}-${month}`}
              className="grid grid-cols-2 gap-3"
            >
              {monthEntries.map((entry) => (
                <motion.div key={entry.id} {...LIST_ITEM} className="grid">
                  <EntryFeedCard entry={entry} onSelect={setSelectedId} onToggleLike={toggleLike} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedId(null)}
        onDelete={handleDelete}
      />
    </AppShell>
  );
};
