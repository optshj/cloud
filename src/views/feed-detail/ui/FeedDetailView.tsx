"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { HeartIcon, XIcon } from "@/shared/ui/icons";
import { PlaceholderPhoto } from "@/shared/ui/PlaceholderPhoto";
import { formatDisplayDate } from "@/shared/lib/date";
import { ReportButton } from "@/features/report-entry";
import { useCloudEntries } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { signInWithKakao } from "@/features/login-kakao";

export function FeedDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const { entries, toggleLike } = useCloudEntries();
  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return (
      <AppShell theme="feed">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-neutral-500">
          <p>기록을 찾을 수 없어요</p>
          <button type="button" onClick={() => router.push("/feed")} className={`${BRUTAL} bg-white px-3 py-1.5 font-bold`}>
            피드로 돌아가기
          </button>
        </div>
      </AppShell>
    );
  }

  function handleToggleLike() {
    if (!user) return signInWithKakao();
    toggleLike(entry!.id);
  }

  // 피드 모달은 사진첩 모달과 달리, 같은 목록의 다른 기록 카드 1~2장을 메인 카드 뒤에
  // 부채꼴로 겹쳐 보여주는 "카드 더미" 연출을 쓴다(목업 `피드 모달.png` 기준).
  const stackEntries = [...entries]
    .filter((e) => e.id !== entry.id)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2);
  const stackTilts = ["rotate-6 translate-x-4 -translate-y-3", "-rotate-6 -translate-x-4 translate-y-3"];

  return (
    <AppShell theme="feed">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <div className="relative w-full max-w-xs">
          {stackEntries.map((stackEntry, i) => (
            <div
              key={stackEntry.id}
              aria-hidden
              className={`${BRUTAL_SM} absolute inset-0 z-0 flex flex-col overflow-hidden bg-white ${stackTilts[i % stackTilts.length]}`}
            >
              <PlaceholderPhoto
                photoDataUrl={stackEntry.photoDataUrl}
                placeholderClass={stackEntry.placeholderClass}
                className="aspect-square w-full"
              />
              <div className="flex flex-1 flex-col gap-1 p-2">
                <p className="text-xs text-neutral-600">{stackEntry.location}</p>
                <p className="text-sm font-extrabold">{stackEntry.tag}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <HeartIcon className="h-4 w-4" />
                  <span className="text-base font-extrabold">{stackEntry.likes}</span>
                </div>
              </div>
            </div>
          ))}

          <div className={`${BRUTAL} relative z-10 -rotate-1 bg-white p-2`}>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="닫기"
              className={`${BRUTAL_SM} absolute -right-3 -top-3 z-20 flex h-9 w-9 rotate-2 items-center justify-center bg-white`}
            >
              <XIcon className="h-4 w-4" />
            </button>
            <ReportButton
              entryId={entry.id}
              className={`${BRUTAL_SM} absolute -left-3 -top-3 z-20 flex h-9 w-9 rotate-2 items-center justify-center bg-white disabled:opacity-50`}
            />

            <PlaceholderPhoto
              photoDataUrl={entry.photoDataUrl}
              placeholderClass={entry.placeholderClass}
              className="aspect-square w-full border-2 border-black"
            />

            <div className="space-y-1 px-1 pb-1 pt-3">
              <p className="text-xs text-neutral-600">{entry.location}</p>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={handleToggleLike} className="flex items-center gap-1 text-sm font-bold">
                  <HeartIcon className={`h-4 w-4 ${entry.liked ? "text-rose-500" : "text-black"}`} filled={entry.liked} />
                  {entry.likes}
                </button>
                <p className="text-xs text-neutral-600">{formatDisplayDate(entry.date)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${BRUTAL_SM} relative z-10 -mt-3 w-fit max-w-[85%] rotate-1 rounded-full bg-white px-5 py-2 text-center text-sm font-extrabold leading-snug`}>
          {entry.comment}
        </div>
      </div>
    </AppShell>
  );
}
