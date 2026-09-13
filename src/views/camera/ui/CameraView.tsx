"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, usePageReady } from "@/widgets/app-shell";
import { BRUTAL } from "@/shared/ui/tokens";
import { Cloud } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatDisplayDate, seoulDateKey } from "@/shared/lib/date";
import {
  CameraLive,
  CapturePermissionGate,
  CapturePreview,
  hasCapturePermission,
} from "@/features/capture-cloud";
import type { Captured, Coords } from "@/features/capture-cloud";
import { buildShareCardDataUrl, downloadDataUrl } from "@/features/share-card";
import { deleteEntryRemote, useCloudEntries, useTodaysEntry } from "@/entities/cloud-entry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { createClient } from "@/shared/lib/supabase/client";
import { toast } from "sonner";

const BUCKET = "entry-photos";
// 카카오 OAuth는 전체 페이지 이동이라 비로그인 촬영분을 sessionStorage로 넘긴다.
const PENDING_CAPTURE_KEY = "cloud:pending-capture";

type PendingCapture = { photoDataUrl: string; coords: Coords };

type Stage =
  | { kind: "permission" }
  | { kind: "idle" }
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
  const { user, isLoading: isSessionLoading } = useSession();
  const { refresh } = useCloudEntries();
  const todaysEntry = useTodaysEntry(user?.id);
  const [stage, setStage] = useState<Stage>(() =>
    hasCapturePermission() ? { kind: "idle" } : { kind: "permission" },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRetakeOpen, setIsRetakeOpen] = useState(false);
  // todaysEntry는 마운트 때 한 번만 조회하므로, 지운 뒤엔 이 플래그로 덮는다.
  const [hasDeletedToday, setHasDeletedToday] = useState(false);
  const [isDeletingToday, setIsDeletingToday] = useState(false);
  // 캔버스 합성 + 원격 이미지 로드라 수백 ms~수 초 걸린다 — 누른 티가 나야 두 번 안 누른다.
  const [isDownloading, setIsDownloading] = useState(false);
  // 탭 전환 오버레이가 덮여있는 동안 세션 확인이 끝나야 걷힌다 — 카메라 화면 자체는
  // 데이터 로딩 없이 바로 그려지지만, 로그인 여부에 따라 흐름이 갈리니 그것만 기다린다.
  usePageReady(!isSessionLoading);

  const todayKey = seoulDateKey();

  const processCapture = useCallback(async (photoDataUrl: string, coords: Coords) => {
    setStage({ kind: "generating", photoDataUrl });

    try {
      const blob = await (await fetch(photoDataUrl)).blob();
      // 경로는 공개 피드에 실리므로 uid·날짜를 담지 않는다(migrations/0004).
      const photoPath = `${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(photoPath, blob, { contentType: "image/jpeg" });
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
      toast.error(err instanceof Error ? err.message : "촬영 처리에 실패했어요");
      setStage({ kind: "idle" });
    }
  }, []);

  const discardUploaded = (photoPath: string) => {
    void createClient()
      .storage.from(BUCKET)
      .remove([photoPath])
      .catch((err) => console.error("camera: 버린 사진 삭제 실패", photoPath, err));
  };

  const handleCapture = async (photoDataUrl: string, coords: Coords) => {
    if (!user) {
      try {
        // data URL이 커서 QuotaExceededError가 날 수 있다 — 미리보기는 살린다.
        sessionStorage.setItem(
          PENDING_CAPTURE_KEY,
          JSON.stringify({ photoDataUrl, coords } satisfies PendingCapture),
        );
      } catch (err) {
        console.error("camera: 비로그인 촬영 임시 보관 실패", err);
      }
      setStage({ kind: "anon-ready", photoDataUrl });
      return;
    }
    await processCapture(photoDataUrl, coords);
  };

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
      // react-hooks/set-state-in-effect 회피
      queueMicrotask(() => {
        void processCapture(pending.photoDataUrl, pending.coords);
      });
    } catch (err) {
      console.error("failed to resume pending capture", err);
    }
  }, [isSessionLoading, user, processCapture]);

  const handleRetake = () => {
    sessionStorage.removeItem(PENDING_CAPTURE_KEY);
    if (stage.kind === "ready") {
      discardUploaded(stage.photoPath);
    }
    setStage({ kind: "idle" });
  };

  const handleRetakeToday = async () => {
    if (!todaysEntry) {
      return;
    }
    setIsDeletingToday(true);
    try {
      await deleteEntryRemote(todaysEntry.id);
    } catch (err) {
      console.error("camera: 오늘 기록 삭제 실패", todaysEntry.id, err);
      toast.error("오늘 기록을 지우지 못했어요. 잠시 후 다시 시도해주세요.");
      return;
    } finally {
      setIsDeletingToday(false);
    }
    setIsRetakeOpen(false);
    setHasDeletedToday(true);
    setStage({ kind: "idle" });
  };

  const handleRecord = async () => {
    if (stage.kind !== "ready") {
      return;
    }
    setIsSaving(true);
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
        discardUploaded(stage.photoPath);
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
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (stage.kind !== "ready") {
      return;
    }
    setIsDownloading(true);
    try {
      const dataUrl = await buildShareCardDataUrl({
        photoDataUrl: stage.captured.photoDataUrl,
        location: stage.locationDong,
        comment: stage.captured.comment,
        displayDate: formatDisplayDate(todayKey),
      });
      downloadDataUrl(dataUrl, `구름-${todayKey}.png`);
    } catch (err) {
      console.error("camera: 공유카드 생성 실패", err);
      toast.error("카드 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <AppShell theme="camera" title="카메라">
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          aria-busy="true"
          aria-label="카메라 준비 중"
        >
          <span aria-hidden className="shimmer absolute inset-0 block" />
          <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-6 pb-28">
            <Skeleton className={`${BRUTAL} h-16 w-16 rounded-full`} />
          </div>
        </div>
      </AppShell>
    );
  }

  if ((todaysEntry && !hasDeletedToday) || stage.kind === "already-done") {
    return (
      <AppShell theme="camera" title="카메라">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className={`${BRUTAL} bg-white p-4`}>
            <Cloud className="h-10 w-10 text-sky-300" fill="currentColor" strokeWidth={0} />
          </div>
          <p className="font-bold">오늘 구름은 이미 기록했어요</p>
          {todaysEntry && !hasDeletedToday && (
            <p className="text-sm text-neutral-600">&ldquo;{todaysEntry.comment}&rdquo;</p>
          )}
          <Button onClick={() => router.push("/calendar")}>사진첩에서 보기</Button>
          {todaysEntry && !hasDeletedToday && (
            <Button onClick={() => setIsRetakeOpen(true)}>오늘 다시 찍기</Button>
          )}
          <AlertDialog open={isRetakeOpen} onOpenChange={setIsRetakeOpen}>
            <AlertDialogContent>
              <AlertDialogTitle>오늘 기록을 지우고 다시 찍을까요?</AlertDialogTitle>
              <AlertDialogDescription>
                오늘 기록한 사진과 코멘트가 함께 지워져요. 되돌릴 수 없어요.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  // preventDefault 없으면 Radix가 즉시 닫아 진행 상태가 안 보인다.
                  onClick={(e) => {
                    e.preventDefault();
                    void handleRetakeToday();
                  }}
                  disabled={isDeletingToday}
                  aria-busy={isDeletingToday}
                >
                  {isDeletingToday ? "지우는 중..." : "지우고 다시 찍기"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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

  const renderOverlay = () => {
    if (stage.kind === "generating") {
      // 카드 골격은 CapturePreview와 같게 유지한다.
      return (
        <div className="animate-overlay-in flex min-h-0 flex-1 flex-col bg-black/60 p-6 pb-28">
          <div
            className={`animate-modal-in flex min-h-0 flex-1 flex-col overflow-y-auto ${BRUTAL} relative bg-white p-3`}
          >
            <div className="relative min-h-[30dvh] flex-1 overflow-hidden border-2 border-black">
              <img
                src={stage.photoDataUrl}
                alt="방금 촬영한 하늘 사진"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
                <div className={`${BRUTAL} bg-white p-4`}>
                  <Cloud
                    className="h-10 w-10 animate-pulse text-sky-300"
                    fill="currentColor"
                    strokeWidth={0}
                  />
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
        </div>
      );
    }

    if (stage.kind === "anon-ready") {
      return (
        <CapturePreview
          captured={{ photoDataUrl: stage.photoDataUrl }}
          dateKeyStr={todayKey}
          isLoggedIn={false}
          loginSlot={<KakaoLoginButton className="w-full py-3 text-base" />}
          onRetake={handleRetake}
        />
      );
    }

    if (stage.kind === "ready") {
      return (
        <CapturePreview
          captured={stage.captured}
          location={stage.locationDong}
          dateKeyStr={todayKey}
          isSaving={isSaving}
          isDownloading={isDownloading}
          onRetake={handleRetake}
          onRecord={handleRecord}
          onDownload={handleDownload}
        />
      );
    }

    return null;
  };

  const overlay = renderOverlay();

  return (
    <AppShell theme="camera" title="카메라">
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* 오버레이는 포인터만 막으므로 inert로 키보드·스크린리더도 막는다. */}
        <div className="flex min-h-0 flex-1 flex-col" inert={overlay !== null}>
          <CameraLive onCapture={handleCapture} isPaused={overlay !== null} />
        </div>
        {overlay && (
          <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto">{overlay}</div>
        )}
      </div>
    </AppShell>
  );
};
