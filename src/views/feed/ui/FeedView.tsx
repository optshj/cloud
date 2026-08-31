"use client";

import { AppShell } from "@/widgets/app-shell";
import { EntryFeedCard } from "@/widgets/entry-card";
import { useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";

export function FeedView() {
  const { user } = useSession();
  const { entries, toggleLike } = useCloudEntries();

  function handleToggleLike(id: string) {
    if (!user) return signInWithKakao();
    toggleLike(id);
  }

  const sorted = [...entries].sort((a, b) => b.likes - a.likes);

  return (
    <AppShell theme="feed">
      <div className="grid grid-cols-2 gap-3 p-4">
        {sorted.map((entry, index) => (
          <EntryFeedCard key={entry.id} entry={entry} index={index} onToggleLike={handleToggleLike} />
        ))}
      </div>
    </AppShell>
  );
}
