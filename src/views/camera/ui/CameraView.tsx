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
  const { user, isLoading: isSessionLoading } = useSession();
  const { refresh } = useCloudEntries();
  // 공개 피드(entry_feed)에는 user_id가 없어 다른 유저의 오늘 기록과 구분이 안 된다 —
  // "내가 오늘 이미 기록했는지"는 별도로 본인 소유 행만 조회한다.
  const todaysEntry = useTodaysEntry(user?.id);
  // 이 문서에서 이미 게이트를 통과했으면 다시 세우지 않는다 — 탭을 오갈 때마다 권한을
  // 다시 묻는 것처럼 보이던 원인이다.
  const [stage, setStage] = useState<Stage>(() =>
    hasCapturePermission() ? { kind: "idle" } : { kind: "permission" },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRetakeOpen, setIsRetakeOpen] = useState(false);
  // 오늘 기록을 방금 지웠다는 사실. todaysEntry는 마운트 때 한 번만 조회하므로 지운 뒤에도
  // 값이 남아 "이미 기록했어요" 화면으로 되돌아간다 — 그걸 이 플래그가 덮는다.
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
      // 경로에 uid도 날짜도 담지 않는다 — public 피드에 그대로 실리는 값이라 폴더명이 곧
      // user_id였고 그게 "이 사진들이 같은 사람 것"을 넘겨줬다(→ supabase/migrations/0004).
      // 소유권은 이제 storage의 owner_id가 들고 있어서 경로가 불투명해도 된다.
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

  // 촬영마다 새 경로라 예전처럼 다음 업로드가 덮어써주지 않는다 — 기록되지 않은 사진은 직접 지운다.
  // (놓쳐도 탈퇴 시 DELETE /api/account가 업로더 기준으로 전부 지운다.)
  const discardUploaded = (photoPath: string) => {
    void createClient()
      .storage.from(BUCKET)
      .remove([photoPath])
      .catch((err) => console.error("camera: 버린 사진 삭제 실패", photoPath, err));
  };

  const handleCapture = async (photoDataUrl: string, coords: Coords) => {
    if (!user) {
      try {
        // 사진 데이터 URL이라 용량이 커서 QuotaExceededError가 날 수 있다 — 여기서 throw되면
        // 미리보기까지 통째로 죽는다. 보관에 실패해도 미리보기·다운로드는 그대로 되고,
        // 로그인 후 이어받기만 안 될 뿐이다.
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

  // 하루 1장은 그대로다 — 새 슬롯을 여는 게 아니라 오늘 행을 지우고 그 자리에 다시 찍는다.
  // (사진첩에서 삭제 → 카메라로 돌아오던 경로를 한 번에 줄인 것이고, DB의
  // unique (user_id, entry_date)도 그대로다.)
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
    // 목록을 다시 받지 않는다 — 이 화면은 useCloudEntries의 entries를 읽지 않고,
    // 사진첩은 라우트 이동 때 자기 인스턴스로 새로 조회한다. 기다리면 복귀만 늦다.
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
          {/* pb는 기존 여백(32px) + 떠 있는 BottomNav 높이(약 80px) — 뷰파인더는 탭 뒤까지
              차오르되 셔터/줌은 탭 위에 그대로 남는다. */}
          <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-6 pb-28">
            {/* 줌 배지 자리는 비워둔다 — 뷰파인더가 뜨기 전에 조작할 수 없는 컨트롤이라
                자리만 잡아두면 로딩 화면만 복잡해진다. 셔터는 이 화면의 주 동작이라 남긴다. */}
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
          {/* 두 버튼은 같은 층의 선택지다 — variant/size를 다르게 주면 한쪽만 테두리가 얇아져
              "덜 눌러도 되는 것"처럼 보인다. */}
          <Button onClick={() => router.push("/calendar")}>사진첩에서 보기</Button>
          {/* 오늘 기록이 확인된 경우에만 — confirm이 409로 돌려준 already-done 상태나 방금 지운
              뒤에는 지울 행의 id가 없다(있어도 stale이다). */}
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
                  // preventDefault가 없으면 Radix가 클릭 즉시 창을 닫아, 아래 "지우는 중..."과
                  // disabled가 화면에 한 프레임도 안 뜬다. 끝난 뒤 직접 닫는다.
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

  // 촬영 이후 단계는 카메라 화면을 대체하지 않고 그 위에 얹는다 — 뒤에 뷰파인더가 살아 있어야
  // "다른 화면으로 넘어갔다"가 아니라 "위에 떴다"로 읽힌다.
  const renderOverlay = () => {
    // 업로드 + AI 코멘트 생성은 몇 초 걸린다 — 빈 화면 대신 방금 찍은 사진을 보여준 채로 기다린다.
    if (stage.kind === "generating") {
      // 카드 골격은 CapturePreview와 같다 — 카드가 영역을 꽉 채우고 사진이 남은 높이를 먹는다.
      // 카드 테두리 위치는 두 상태에서 같고, 결과가 도착하면 코멘트·버튼이 들어오는 만큼
      // 사진 칸만 줄어든다(자리를 미리 비워두면 사용자가 지적한 "빈 줄"이 다시 생긴다).
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
        {/* 오버레이는 포인터만 막는다 — Tab/스크린리더는 뒤의 셔터·줌에 그대로 닿아서
            미리보기를 보는 중에 촬영이 덮어써질 수 있다. inert로 트리째 빼둔다. */}
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
