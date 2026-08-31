"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL } from "@/shared/ui/tokens";
import { CloudIcon } from "@/shared/ui/icons";
import { formatDisplayDate, seoulDateKey } from "@/shared/lib/date";
import { CameraLive, CapturePreview } from "@/features/capture-cloud";
import type { Captured, Coords } from "@/features/capture-cloud";
import { buildShareCardDataUrl, downloadDataUrl } from "@/features/share-card";
import { useCloudEntries, useTodaysEntry } from "@/entities/cloud-entry";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { createClient } from "@/shared/lib/supabase/client";

const BUCKET = "entry-photos";
// 카카오 로그인은 전체 페이지 이동(OAuth 리다이렉트)이라 React state가 다 날아간다 —
// 비로그인 촬영 → 로그인 사이에 사진을 살려두려고 sessionStorage에 잠깐 보관한다.
const PENDING_CAPTURE_KEY = "cloud:pending-capture";

type PendingCapture = { photoDataUrl: string; coords: Coords };

type Stage =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "anon-ready"; photoDataUrl: string }
  | {
      kind: "ready";
      captured: Captured;
      locationDong: string;
      photoPath: string;
      coords: Coords;
    }
  | { kind: "already-done" };

export function CameraView() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { refresh } = useCloudEntries();
  // 공개 피드(entry_feed)에는 user_id가 없어 다른 유저의 오늘 기록과 구분이 안 된다 —
  // "내가 오늘 이미 기록했는지"는 별도로 본인 소유 행만 조회한다.
  const todaysEntry = useTodaysEntry(user?.id);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = seoulDateKey();

  const processCapture = useCallback(
    async (currentUserId: string, photoDataUrl: string, coords: Coords) => {
      setError(null);
      setStage({ kind: "generating" });

      try {
        const blob = await (await fetch(photoDataUrl)).blob();
        const photoPath = `${currentUserId}/${todayKey}.jpg`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(photoPath, blob, { upsert: true, contentType: "image/jpeg" });
        if (uploadError) throw uploadError;

        const res = await fetch("/api/entries/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoPath, lat: coords.lat, lng: coords.lng }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "미리보기 생성에 실패했어요");
        }
        const { tag, comment, locationDong } = await res.json();

        setStage({
          kind: "ready",
          captured: { photoDataUrl, tag, comment },
          locationDong,
          photoPath,
          coords,
        });
      } catch (err) {
        console.error("capture processing failed", err);
        setError(err instanceof Error ? err.message : "촬영 처리에 실패했어요");
        setStage({ kind: "idle" });
      }
    },
    [todayKey],
  );

  async function handleCapture(photoDataUrl: string, coords: Coords) {
    if (!user) {
      sessionStorage.setItem(
        PENDING_CAPTURE_KEY,
        JSON.stringify({ photoDataUrl, coords } satisfies PendingCapture),
      );
      setStage({ kind: "anon-ready", photoDataUrl });
      return;
    }
    await processCapture(user.id, photoDataUrl, coords);
  }

  // 비로그인 촬영 → 카카오 로그인(전체 페이지 이동) → 돌아왔을 때, 찍어둔 사진이 있으면 이어서 처리한다.
  useEffect(() => {
    if (sessionLoading || !user) return;
    const raw = sessionStorage.getItem(PENDING_CAPTURE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_CAPTURE_KEY);
    try {
      const pending = JSON.parse(raw) as PendingCapture;
      // effect 본문에서 곧바로 setState하지 않도록 한 틱 미룬다(react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        void processCapture(user.id, pending.photoDataUrl, pending.coords);
      });
    } catch (err) {
      console.error("failed to resume pending capture", err);
    }
  }, [sessionLoading, user, processCapture]);

  function handleRetake() {
    sessionStorage.removeItem(PENDING_CAPTURE_KEY);
    setStage({ kind: "idle" });
  }

  async function handleRecord() {
    if (stage.kind !== "ready") return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/entries/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoPath: stage.photoPath,
          lat: stage.coords.lat,
          lng: stage.coords.lng,
          tag: stage.captured.tag,
          comment: stage.captured.comment,
        }),
      });
      if (res.status === 409) {
        setStage({ kind: "already-done" });
        await refresh();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "저장에 실패했어요");
      }
      await refresh();
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (stage.kind !== "ready") return;
    const dataUrl = await buildShareCardDataUrl({
      photoDataUrl: stage.captured.photoDataUrl,
      location: stage.locationDong,
      comment: stage.captured.comment,
      displayDate: formatDisplayDate(todayKey),
    });
    downloadDataUrl(dataUrl, `구름-${todayKey}.png`);
  }

  if (sessionLoading) {
    return <AppShell theme="camera">{null}</AppShell>;
  }

  if (todaysEntry || stage.kind === "already-done") {
    return (
      <AppShell theme="camera">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <CloudIcon className="h-10 w-10 text-sky-300" />
          </div>
          <p className="font-bold">오늘 구름은 이미 기록했어요</p>
          {todaysEntry && (
            <p className="text-sm text-neutral-600">
              &ldquo;{todaysEntry.comment}&rdquo;
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className={`${BRUTAL} bg-white px-4 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            사진첩에서 보기
          </button>
        </div>
      </AppShell>
    );
  }

  if (stage.kind === "generating") {
    return (
      <AppShell theme="camera">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <CloudIcon className="h-10 w-10 animate-pulse text-sky-300" />
          </div>
          <p className="text-sm font-bold">AI가 하늘을 보고 있어요...</p>
        </div>
      </AppShell>
    );
  }

  if (stage.kind === "anon-ready") {
    return (
      <AppShell theme="camera">
        <CapturePreview
          captured={{ photoDataUrl: stage.photoDataUrl }}
          dateKeyStr={todayKey}
          loggedIn={false}
          loginSlot={
            <KakaoLoginButton
              className={`${BRUTAL} w-full bg-amber-300 py-3 text-center font-extrabold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            />
          }
          onRetake={handleRetake}
        />
      </AppShell>
    );
  }

  if (stage.kind === "ready") {
    return (
      <AppShell theme="camera">
        <CapturePreview
          captured={stage.captured}
          location={stage.locationDong}
          dateKeyStr={todayKey}
          saving={saving}
          onRetake={handleRetake}
          onRecord={handleRecord}
          onDownload={handleDownload}
        />
        {error && (
          <p className="px-6 pb-4 text-center text-xs font-bold text-rose-600">
            {error}
          </p>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell theme="camera">
      {error && (
        <p className="px-6 pt-2 text-center text-xs font-bold text-rose-600">
          {error}
        </p>
      )}
      <CameraLive onCapture={handleCapture} />
    </AppShell>
  );
}
