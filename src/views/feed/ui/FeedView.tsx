"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/widgets/app-shell";
import { EntryFeedCard, EntryFeedCardSkeleton, FeedDetailModal } from "@/widgets/entry-card";
import { useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";
import { BRUTAL, LIST_CONTAINER, LIST_ITEM } from "@/shared/ui/tokens";
import { CloudIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";

export const FeedView = () => {
  const { user } = useSession();
  const { entries, isLoading, error, refresh, toggleLike } = useCloudEntries();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleToggleLike = (id: string) => {
    if (!user) {
      return signInWithKakao();
    }
    toggleLike(id);
  };

  // 좋아요순으로 정렬하지 않는다 — 하트를 누른 카드가 그 자리에서 위로 튀어올라
  // 방금 뭘 눌렀는지 놓치고, 뒤따라 오던 카드들까지 한 칸씩 밀린다.
  // 목록 순서는 fetchEntries가 준 최신순 그대로 둔다.
  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <AppShell theme="feed" title="피드">
        <div className="grid grid-cols-2 gap-3 p-4" aria-busy="true" aria-label="피드 불러오는 중">
          {Array.from({ length: 4 }).map((_, index) => (
            <EntryFeedCardSkeleton key={index} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell theme="feed" title="피드">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <CloudIcon className="h-10 w-10 text-rose-300" />
          </div>
          <p role="alert" className="text-sm font-bold text-rose-600">
            {error}
          </p>
          <Button onClick={() => refresh()}>다시 시도</Button>
        </div>
      </AppShell>
    );
  }

  if (entries.length === 0) {
    return (
      <AppShell theme="feed" title="피드">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <CloudIcon className="h-10 w-10 text-rose-300" />
          </div>
          <p className="font-bold">아직 등록된 구름이 없어요</p>
          <p className="text-sm text-neutral-600">가장 먼저 하늘을 기록해보세요</p>
          <Button asChild>
            <Link href="/">카메라로 가기</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="feed" title="피드">
      <motion.div {...LIST_CONTAINER} className="grid grid-cols-2 gap-3 p-4">
        {entries.map((entry) => (
          // grid로 감싸야 카드가 원래처럼 행 높이만큼 늘어난다(stagger 래퍼를 끼우기 전과 동일).
          <motion.div key={entry.id} {...LIST_ITEM} className="grid">
            <EntryFeedCard entry={entry} onSelect={setSelectedId} onToggleLike={handleToggleLike} />
          </motion.div>
        ))}
      </motion.div>
      {/* 조건부 마운트하면 부모가 먼저 사라져 exit 애니메이션이 씹힌다 — 상시 마운트하고 entry만 비운다. */}
      <FeedDetailModal
        entry={selectedEntry}
        entries={entries}
        onClose={() => setSelectedId(null)}
        onToggleLike={() => {
          if (selectedId) {
            handleToggleLike(selectedId);
          }
        }}
      />
    </AppShell>
  );
};
