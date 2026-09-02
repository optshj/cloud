"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL } from "@/shared/ui/tokens";
import { CloudIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatDisplayDate, seoulDateKey } from "@/shared/lib/date";
import {
  CameraLive,
  CapturePermissionGate,
  CapturePreview,
} from "@/features/capture-cloud";
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
  // 카메라+위치 권한을 촬영 플로우 진입 전에 한 번에 요청하는 게이트 — 셔터를 누를 때
  // 위치 권한 팝업이 튀어나와 흐름이 끊기던 문제를 막는다.
  | { kind: "permission" }
  | { kind: "idle" }
  // AI 대기가 플로우에서 가장 긴 구간이라 방금 찍은 사진을 함께 들고 다닌다 —
  // 빈 화면 대신 그 사진 위에 진행 오버레이를 얹기 위해서.
  | { kind: "generating"; photoDataUrl: string }
  | { kind: "anon-ready"; photoDataUrl: string }
  | {
      kind: "ready";
      captured: Captured;
      locationDong: string;
      photoPath: string;
      coords: Coords;
    }
  | { kind: "already-done" };

export const CameraView = () => {
  const router = useRouter();
  const { user, loading: isSessionLoading } = useSession();
  const { refresh } = useCloudEntries();
  // 공개 피드(entry_feed)에는 user_id가 없어 다른 유저의 오늘 기록과 구분이 안 된다 —
  // "내가 오늘 이미 기록했는지"는 별도로 본인 소유 행만 조회한다.
  const todaysEntry = useTodaysEntry(user?.id);
  const [stage, setStage] = useState<Stage>({ kind: "permission" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = seoulDateKey();

  const processCapture = useCallback(
    async (currentUserId: string, photoDataUrl: string, coords: Coords) => {
      setError(null);
      setStage({ kind: "generating", photoDataUrl });

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

  const handleCapture = async (photoDataUrl: string, coords: Coords) => {
    if (!user) {
      sessionStorage.setItem(
        PENDING_CAPTURE_KEY,
        JSON.stringify({ photoDataUrl, coords } satisfies PendingCapture),
      );
      setStage({ kind: "anon-ready", photoDataUrl });
      return;
    }
    await processCapture(user.id, photoDataUrl, coords);
  };

  // 비로그인 촬영 → 카카오 로그인(전체 페이지 이동) → 돌아왔을 때, 찍어둔 사진이 있으면 이어서 처리한다.
  useEffect(() => {
    if (isSessionLoading || !user) {
      return;
    }
    const raw = sessionStorage.getItem(PENDING_CAPTURE_KEY);
    if (!raw) {
      return;
    }
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
  }, [isSessionLoading, user, processCapture]);

  const handleRetake = () => {
    sessionStorage.removeItem(PENDING_CAPTURE_KEY);
    setStage({ kind: "idle" });
  };

  const handleRecord = async () => {
    if (stage.kind !== "ready") {
      return;
    }
    setIsSaving(true);
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
      console.error("camera: 기록 저장(POST /api/entries/confirm) 실패", err);
      setError(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (stage.kind !== "ready") {
      return;
    }
    const dataUrl = await buildShareCardDataUrl({
      photoDataUrl: stage.captured.photoDataUrl,
      location: stage.locationDong,
      comment: stage.captured.comment,
      displayDate: formatDisplayDate(todayKey),
    });
    downloadDataUrl(dataUrl, `구름-${todayKey}.png`);
  };

  // 세션 조회 중 {null}을 렌더하면 빈 흰 화면이 깜빡인다 — 뷰파인더 골격을 그대로 잡아둔다.
  if (isSessionLoading) {
    return (
      <AppShell theme="camera" title="카메라">
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          aria-busy="true"
          aria-label="카메라 준비 중"
        >
          <span aria-hidden className="shimmer absolute inset-0 block" />
          <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pb-8 pt-6">
            <Skeleton
              aria-hidden
              className="h-11 w-full max-w-[240px] rounded-none"
            />
            <Skeleton className={`${BRUTAL} h-16 w-16 rounded-full`} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (todaysEntry || stage.kind === "already-done") {
    return (
      <AppShell theme="camera" title="카메라">
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
          <Button onClick={() => router.push("/calendar")}>
            사진첩에서 보기
          </Button>
        </div>
      </AppShell>
    );
  }

  // 업로드 + AI 코멘트 생성은 몇 초 걸린다 — 빈 화면 대신 방금 찍은 사진을 보여준 채로 기다린다.
  if (stage.kind === "generating") {
    return (
      <AppShell theme="camera" title="카메라">
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className={`${BRUTAL} relative bg-white p-3`}>
            <div className="relative overflow-hidden border-2 border-black">
              <img
                src={stage.photoDataUrl}
                alt="방금 촬영한 하늘 사진"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
                <div className={`${BRUTAL} bg-white p-4`}>
                  <CloudIcon className="h-10 w-10 animate-pulse text-sky-300" />
                </div>
                <p role="status" className="text-sm font-extrabold">
                  AI가 하늘을 보고 있어요...
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>
          </div>
          <Skeleton className={`${BRUTAL} h-12 w-full`} />
        </div>
      </AppShell>
    );
  }

  if (stage.kind === "anon-ready") {
    return (
      <AppShell theme="camera" title="카메라">
        <CapturePreview
          captured={{ photoDataUrl: stage.photoDataUrl }}
          dateKeyStr={todayKey}
          isLoggedIn={false}
          loginSlot={<KakaoLoginButton className="w-full py-3 text-base" />}
          onRetake={handleRetake}
        />
      </AppShell>
    );
  }

  if (stage.kind === "ready") {
    return (
      <AppShell theme="camera" title="카메라">
        <CapturePreview
          captured={stage.captured}
          location={stage.locationDong}
          dateKeyStr={todayKey}
          isSaving={isSaving}
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

  if (stage.kind === "permission") {
    return (
      <AppShell theme="camera" title="카메라">
        <CapturePermissionGate onGranted={() => setStage({ kind: "idle" })} />
      </AppShell>
    );
  }

  return (
    <AppShell theme="camera" title="카메라">
      {error && (
        <p className="px-6 pt-2 text-center text-xs font-bold text-rose-600">
          {error}
        </p>
      )}
      <CameraLive onCapture={handleCapture} />
    </AppShell>
  );
};
