"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/widgets/app-shell";
import { EntryFeedCard, FeedDetailModal } from "@/widgets/entry-card";
import { useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";
import { BRUTAL } from "@/shared/ui/tokens";
import { CloudIcon } from "@/shared/ui/icons";

export const FeedView = () => {
  const { user } = useSession();
  const {
    entries,
    loading: isLoading,
    error,
    refresh,
    toggleLike,
  } = useCloudEntries();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleToggleLike = (id: string) => {
    if (!user) return signInWithKakao();
    toggleLike(id);
  };

  const sorted = [...entries].sort((a, b) => b.likes - a.likes);
  const selectedEntry = sorted.find((e) => e.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <AppShell theme="feed" title="피드">
        <div
          className="grid grid-cols-2 gap-3 p-4"
          aria-busy="true"
          aria-label="피드 불러오는 중"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`${BRUTAL} aspect-square animate-pulse bg-white/60`}
            />
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
          <button
            type="button"
            onClick={() => refresh()}
            className={`${BRUTAL} bg-white px-4 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            다시 시도
          </button>
        </div>
      </AppShell>
    );
  }

  if (sorted.length === 0) {
    return (
      <AppShell theme="feed" title="피드">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <CloudIcon className="h-10 w-10 text-rose-300" />
          </div>
          <p className="font-bold">아직 등록된 구름이 없어요</p>
          <p className="text-sm text-neutral-600">
            가장 먼저 하늘을 기록해보세요
          </p>
          <Link
            href="/"
            className={`${BRUTAL} bg-white px-4 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            카메라로 가기
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="feed" title="피드">
      <div className="grid grid-cols-2 gap-3 p-4">
        {sorted.map((entry, index) => (
          <EntryFeedCard
            key={entry.id}
            entry={entry}
            index={index}
            onSelect={setSelectedId}
            onToggleLike={handleToggleLike}
          />
        ))}
      </div>
      {selectedEntry && (
        <FeedDetailModal
          entry={selectedEntry}
          entries={sorted}
          onClose={() => setSelectedId(null)}
          onToggleLike={() => handleToggleLike(selectedEntry.id)}
        />
      )}
    </AppShell>
  );
};
