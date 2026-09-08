"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, usePageReady } from "@/widgets/app-shell";
import { BRUTAL, BRUTAL_SM, LIST_CONTAINER, LIST_ITEM } from "@/shared/ui/tokens";
import { Camera, ChevronLeft, ChevronRight, Cloud } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EntryDetailModal, MonthCalendarGrid } from "@/widgets/month-calendar";
import { EntryListCard } from "@/widgets/entry-card";
import { deleteEntryRemote, useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { dateKey, seoulDateKey } from "@/shared/lib/date";
import { toast } from "sonner";

export const CalendarView = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const { entries: allEntries, isLoading, error, refresh } = useCloudEntries();
  // 탭 전환 오버레이가 덮여있는 동안 실제로 이 로딩이 끝나야 걷힌다 —
  // 아래 "구름 모으는 중..." 스켈레톤은 오버레이 없이(직접 진입) 들어왔을 때를 위한 것.
  usePageReady(!isLoading && !isSessionLoading);
  // 사진첩은 내 앨범이다 — 피드와 같은 조회를 쓰되 내 기록만 남긴다.
  // (전체공개라 조회 자체는 남의 기록도 내려오지만 여기선 보여주지 않는다.)
  const entries = allEntries.filter((e) => e.isMine);
  // 처음 보여줄 달도 KST 기준이다 — 기기 로컬로 잡으면 월말 자정 근처에
  // "이번 달"이라며 연 달이 isThisMonth(KST)와 어긋나 다음 달 버튼이 엉뚱하게 열린다.
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = seoulDateKey().split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  // 지난 달로 계속 넘기면 작년으로 넘어간다 — "9월"만으로는 어느 해인지 알 수 없으니
  // 올해가 아닐 때만 연도를 덧붙인다(올해엔 군더더기라 숨긴다).
  const isThisYear = year === Number(seoulDateKey().slice(0, 4));
  // 아직 오지 않은 달엔 기록이 있을 수 없다 — 빈 달력만 나오므로 넘어가지 못하게 막는다.
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
    // 비로그인이거나 남의 글이면 RLS가 막아서 여기선 실패를 조용히 무시하고 그냥 다시 불러온다.
    await deleteEntryRemote(id).catch((err) => {
      console.error("calendar: 기록 삭제 실패", id, entry.date, err);
      // 토스트가 없으면 지운 줄 알았던 카드가 새로고침 뒤 말없이 되살아난다.
      toast.error("기록을 지우지 못했어요. 잠시 후 다시 시도해주세요.");
    });
    await refresh();
  };

  // 달력 골격만 먼저 그려두면 사진이 도착하기 전까지 "기록 없는 달"로 읽힌다 —
  // 조회 중에는 구름 로더 하나만 두고, 끝나면 달력과 사진을 한 번에 드러낸다.
  // 세션 조회도 같이 기다린다 — 빈 상태 문구가 로그인 여부로 갈리는데 useSession이 더 늦게
  // 끝나면, 이미 로그인한 사람에게 카카오 로그인 버튼이 한 번 깜빡였다가 바뀐다.
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

  // 사진첩은 내 기록만 보여주는 화면이라 비로그인이면 볼 게 없다 — 빈 달력을 보여줘봤자
  // 혼란만 주니 캘린더 자체를 숨기고 로그인 유도만 보여준다.
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
          {/* 화살표도 월 라벨과 같은 어휘 — 흰 대지 + 검은 테두리 + 하드섀도에,
              달력 칸의 미니 폴라로이드처럼 라벨과 반대 방향으로 기울인다. */}
          <Button
            variant="thin"
            size="icon"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="rotate-2"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.75} />
          </Button>
          {/* 달력 칸의 미니 폴라로이드와 같은 언어 — 아래 여백을 넓게 둬 사진 대지처럼 보이게 한다. */}
          <div className={`${BRUTAL_SM} -rotate-2 bg-white px-5 pt-1.5 pb-2 text-center`}>
            <p className="text-xl leading-tight font-extrabold">{month + 1}월</p>
            {/* 조회가 실패했는데 "0장 기록"을 띄우면 확정값처럼 읽힌다 — 그 자리를 비운다. */}
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

        {/* pb는 기존 여백 + 떠 있는 BottomNav 높이(약 80px) — 마지막 카드가 탭에 안 가리게. */}
        <div className="flex flex-col gap-4 px-4 pb-24">
          {error && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p role="alert" className="text-center text-sm font-bold text-rose-600">
                {error}
              </p>
              {/* 피드에는 있던 재시도가 여기만 없었다 — 같은 실패에 같은 탈출구를 준다. */}
              <Button onClick={() => refresh()}>다시 시도</Button>
            </div>
          )}
          {!error && monthEntries.length === 0 && (
            /* 달력 칸의 미니 폴라로이드를 그대로 키운 빈 대지 — 아직 안 붙인 사진 한 장으로 읽힌다.
               지난 달은 이제 와서 찍을 수 없으니 CTA는 이번 달에만 붙인다. */
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
                  <EntryListCard entry={entry} onSelect={setSelectedId} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 조건부 마운트하면 부모가 먼저 사라져 exit 애니메이션이 씹힌다 — 상시 마운트하고 entry만 비운다. */}
      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedId(null)}
        onDelete={handleDelete}
      />
    </AppShell>
  );
};
