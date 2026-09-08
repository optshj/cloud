"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOff, Cloud, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { captureFrame } from "../lib/capture-frame";
import { resolveZoomRange, type ZoomRange } from "../lib/zoom-range";
import { forgetCapturePermission } from "./CapturePermissionGate";

// 하드웨어 줌을 못 쓰는 기기(iOS Safari가 대표적이다)에서 CSS scale()로 흉내 낼 폭.
const DIGITAL_ZOOM_RANGE = { min: 1, max: 5, step: 0.1 };

// getUserMedia가 던지는 DOMException.name별 안내. 권한 문제가 아닌 실패에 "설정에서 허용해주세요"라고
// 하면 사용자는 고칠 수 없는 곳을 헤맨다.
const CAMERA_ERROR_MESSAGE: Record<string, string> = {
  NotAllowedError: "카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.",
  SecurityError: "카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.",
  NotReadableError: "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해주세요.",
  TrackStartError: "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해주세요.",
  NotFoundError: "이 기기에서 카메라를 찾지 못했어요.",
  DevicesNotFoundError: "이 기기에서 카메라를 찾지 못했어요.",
  default: "카메라를 열지 못했어요. 다시 시도해주세요.",
};

// zoom은 Image Capture 스펙이라 lib.dom 타입에 없다 — 지원 기기에만 있는 확장 필드다.
type ZoomCapabilities = MediaTrackCapabilities & { zoom?: Partial<ZoomRange> };

export type Coords = { lat: number; lng: number };

const COORDS_TIMEOUT_MS = 8000;
// 이 화면에 들어온 뒤 받아둔 fix를 셔터가 그대로 쓰게 하는 창. 동 단위로만 저장/표시하므로
// (→ docs/PRODUCT.md "확정된 제품 스펙") 2분 전 좌표여도 결과가 달라지지 않는다.
const COORDS_MAX_AGE_MS = 120_000;

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: COORDS_TIMEOUT_MS,
  // 기본값 0이면 granted 상태에서도 매번 새 fix를 기다려 셔터가 몇 초씩 멈춘다.
  maximumAge: COORDS_MAX_AGE_MS,
};

const getCurrentPosition = (): Promise<Coords> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("위치 서비스를 지원하지 않는 브라우저예요"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        // 문서 도중에 권한이 꺼진 경우 — 게이트 통과 기억을 지워 다음 진입에 다시 세운다.
        if (err.code === err.PERMISSION_DENIED) {
          forgetCapturePermission();
        }
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해주세요."
              : "위치 확인에 실패했어요. 다시 시도해주세요.",
          ),
        );
      },
      GEO_OPTIONS,
    );
  });

export const CameraLive = ({
  onCapture,
  isPaused = false,
}: {
  onCapture: (photoDataUrl: string, coords: Coords) => void;
  // 미리보기 오버레이가 덮고 있는 동안은 뒤에서 계속 돌 이유가 없다 — 스트림은 살려두되
  // (재진입 시 다시 권한/초기화를 타지 않도록) 재생만 멈춰 마지막 프레임으로 굳힌다.
  isPaused?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState(DIGITAL_ZOOM_RANGE.min);
  // 기기가 돌려주는 범위를 그대로 쓴다 — 단위가 기기마다 다르다(1~8도 있고 100~400도 있다).
  // 그래서 배지에는 절대값이 아니라 최소값 대비 배율을 띄운다.
  const [zoomRange, setZoomRange] = useState<ZoomRange>(DIGITAL_ZOOM_RANGE);
  const [isHardwareZoom, setIsHardwareZoom] = useState(false);
  // 원인을 안 나누면 "다른 앱이 카메라를 쓰는 중"에도 "브라우저 설정에서 허용해주세요"라고
  // 안내하게 된다 — 설정을 열어도 고칠 게 없다. DOMException.name을 그대로 들고 있는다.
  const [cameraErrorName, setCameraErrorName] = useState<string | null>(null);
  const hasCameraError = cameraErrorName !== null;
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // 지원 기기면 렌즈/센서가 직접 당기게 맡긴다 — CSS scale()과 달리 화질이 깎이지 않는다.
        const [track] = stream.getVideoTracks();
        const zoomCapability = (track?.getCapabilities?.() as ZoomCapabilities | undefined)?.zoom;
        const hardwareRange = resolveZoomRange(zoomCapability, DIGITAL_ZOOM_RANGE.step);
        setIsHardwareZoom(hardwareRange !== null);
        setZoomRange(hardwareRange ?? DIGITAL_ZOOM_RANGE);
        setZoom((hardwareRange ?? DIGITAL_ZOOM_RANGE).min);
        setCameraErrorName(null);
      })
      .catch((err: unknown) => {
        const name = err instanceof Error ? err.name : "";
        console.error("capture-cloud: 카메라 스트림 열기 실패", name, err);
        // 권한 기억은 실제 거부일 때만 지운다 — 카메라를 다른 앱이 잡고 있는 경우까지 지우면
        // 멀쩡한 권한이 날아가 게이트를 다시 세운다.
        if (name === "NotAllowedError" || name === "SecurityError") {
          forgetCapturePermission();
        }
        setCameraErrorName(name || "UnknownError");
      });

    return () => {
      isCancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [retryKey]);

  // 셔터를 누르는 순간 처음 fix를 요청하면 몇 초씩 멈춘다. 화면에 들어오자마자 한 번 받아
  // 브라우저 위치 캐시를 데워두면, 셔터의 요청이 maximumAge로 그 캐시를 집어가 즉시 돌아온다.
  //
  // **진입 게이트에 기대면 안 된다.** 게이트는 두 권한이 이미 granted면 permissions.query만 보고
  // 바로 통과시키느라 좌표를 한 번도 안 받는다 — 권한을 이미 허용한 재방문 사용자는 게이트를
  // 지나고도 캐시가 비어 있어서 세션 첫 촬영에서 대기를 그대로 문다. 여기가 그 구멍을 막는다.
  // 실패는 무시한다 — 진짜 결과는 셔터의 요청이 판정하고, 거기서 문구가 뜬다.
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => undefined,
      () => undefined,
      GEO_OPTIONS,
    );
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (isPaused) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }
  }, [isPaused]);

  // 하드웨어 줌은 값을 트랙에 걸어야 실제로 당겨진다. capability만 광고하고 거절하는 기기가
  // 있어서, 실패하면 조용히 두지 않고 디지털 줌으로 내려간다 — 안 그러면 슬라이더가 먹통이 된다.
  useEffect(() => {
    if (!isHardwareZoom) {
      return;
    }
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    track
      ?.applyConstraints({ advanced: [{ zoom }] } as unknown as MediaTrackConstraints)
      .catch((err) => {
        console.error("capture-cloud: 하드웨어 줌 적용 실패, 디지털 줌으로 전환", zoom, err);
        setIsHardwareZoom(false);
        setZoomRange(DIGITAL_ZOOM_RANGE);
        setZoom(DIGITAL_ZOOM_RANGE.min);
      });
  }, [zoom, isHardwareZoom]);

  // 줌은 "손가락이 트랙의 어디에 있나"(절대)가 아니라 "얼마나 움직였나"(상대)로 정한다.
  // 절대 방식이면 보이는 건 가운데 배지 하나뿐인데 값은 트랙 전체에 매핑돼 있어서, 5x에서 배지를
  // 잡는 순간 가운데 값(3x)으로 튄다 — 확대하려고 오른쪽으로 미는데 먼저 축소되는 것처럼 느껴진다.
  // 상대로 두면 어디를 잡든 현재 배율에서 이어진다. 방향은 네이티브 카메라 다이얼과 같게
  // 뒤집어 뒀다 — 다이얼을 왼쪽으로 밀면 확대, 오른쪽으로 밀면 축소다(눈금 위 인디케이터도
  // 같이 왼쪽으로 간다 — 손가락과 반대로 움직이면 고장 난 것처럼 보인다).
  const zoomDragRef = useRef<{ startX: number; startZoom: number } | null>(null);

  const handleZoomPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (hasCameraError) {
      return;
    }
    // 트랙 밖으로 손가락이 나가도 드래그가 이어지게 잡아둔다.
    event.currentTarget.setPointerCapture(event.pointerId);
    zoomDragRef.current = { startX: event.clientX, startZoom: zoom };
  };

  const handleZoomPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = zoomDragRef.current;
    if (!drag) {
      return;
    }
    const trackWidth = event.currentTarget.getBoundingClientRect().width;
    const moved = ((event.clientX - drag.startX) / trackWidth) * (zoomRange.max - zoomRange.min);
    const next = Math.min(zoomRange.max, Math.max(zoomRange.min, drag.startZoom - moved));
    // 눈금은 기기 범위의 최소값을 기준으로 잡는다 — min이 1이 아닌 기기가 있다.
    setZoom(zoomRange.min + Math.round((next - zoomRange.min) / zoomRange.step) * zoomRange.step);
  };

  const handleZoomPointerUp = () => {
    zoomDragRef.current = null;
  };

  // 기기 단위(1~8, 100~400 등)를 그대로 보여주면 "100x"가 뜬다 — 최소값 대비 배율로 환산한다.
  const zoomRatio = zoom / zoomRange.min;

  const handleShutter = async () => {
    if (!videoRef.current) {
      return;
    }
    setIsCapturing(true);
    try {
      // 위에서 마운트 때 미리 받아둔 덕에 보통 캐시에서 즉시 돌아온다 — 셔터가 잠깐
      // 비활성화되는 것 외에 별도 진행 UI는 두지 않는다.
      const coords = await getCurrentPosition();
      // 하드웨어 줌이면 프레임이 이미 당겨진 채로 들어오므로 추가 크롭은 하지 않는다.
      const photoDataUrl = captureFrame(videoRef.current, isHardwareZoom ? 1 : zoom);
      onCapture(photoDataUrl, coords);
    } catch (err) {
      console.error("capture-cloud: 촬영 시 위치 조회 실패", err);
      toast.error(
        err instanceof Error ? err.message : "위치 확인에 실패했어요. 다시 시도해주세요.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* 목업 장식용 구름 — 카메라 초기화 중에만 노출, 권한 거부 화면에는 안 띄운다 */}
      {!isVideoReady && !hasCameraError && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Cloud
            className="absolute top-[38%] left-[8%] h-10 w-14 text-white"
            fill="currentColor"
            strokeWidth={0}
          />
          <Cloud
            className="absolute top-[47%] left-[52%] h-14 w-20 text-white"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
      )}
      {hasCameraError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL_SM} rounded-full bg-white p-3`}>
            <CameraOff className="h-8 w-8 text-sky-300" />
          </div>
          <p role="alert" className="text-sm font-bold">
            {CAMERA_ERROR_MESSAGE[cameraErrorName] ?? CAMERA_ERROR_MESSAGE.default}
          </p>
          <Button
            variant="thin"
            onClick={() => {
              setIsVideoReady(false);
              setCameraErrorName(null);
              setRetryKey((k) => k + 1);
            }}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setIsVideoReady(true)}
            className="absolute inset-0 z-[1] h-full w-full object-cover"
            style={{
              transform: `scale(${isHardwareZoom ? 1 : zoom})`,
              transformOrigin: "center",
            }}
          />
          <div className="pointer-events-none absolute top-4 left-4 z-10 h-12 w-12 border-t-4 border-l-4 border-black" />
          {/* 뷰파인더가 탭 뒤까지 차오르게 되면서 이 모서리도 탭 라벨과 겹쳤다 — 컨트롤과
              같은 높이로 올려 프레임이 "보이는 화면"의 모서리를 잡게 한다. */}
          <div className="pointer-events-none absolute right-4 bottom-28 z-10 h-12 w-12 border-r-4 border-b-4 border-black" />
        </>
      )}

      {/* pb는 기존 여백(32px) + 떠 있는 BottomNav 높이(약 80px) — 뷰파인더는 탭 뒤까지
          차오르되 줌/셔터는 탭 위에 남는다. */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-6 pb-28">
        {/* 평소엔 현재 배율만 보여주는 동그란 배지, 호버/드래그(포커스) 중에만 눈금 슬라이더로
            펼쳐진다 — iOS 카메라 줌과 같은 언어. 조작 자체는 계속 네이티브 range가 한다(투명하게
            줄 전체를 덮고 있어서 접힘/펼침에 상관없이 값 매핑이 동일하다). */}
        <div
          className={`group flex w-full max-w-[240px] flex-col items-center ${hasCameraError ? "pointer-events-none opacity-30" : ""}`}
        >
          <span
            aria-hidden
            className="mb-1 text-sm font-extrabold text-amber-300 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 group-active:opacity-100"
          >
            {zoomRatio.toFixed(1)} x
          </span>
          <div
            className="relative flex h-11 w-full touch-none items-center justify-center"
            onPointerDown={handleZoomPointerDown}
            onPointerMove={handleZoomPointerMove}
            onPointerUp={handleZoomPointerUp}
            onPointerCancel={handleZoomPointerUp}
          >
            <div className="pointer-events-none relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black/55 transition-[width] duration-200 ease-out group-focus-within:w-full group-hover:w-full group-active:w-full">
              <span className="text-xs font-extrabold text-white transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0 group-active:opacity-0">
                {Number.isInteger(zoomRatio) ? zoomRatio : zoomRatio.toFixed(1)}x
              </span>
              {/* 눈금과 range가 같은 폭(줄 전체)을 써야 인디케이터가 손가락과 어긋나지 않는다. */}
              <div className="absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 group-active:opacity-100">
                <div
                  className="h-full"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, rgba(255,255,255,0.6) 0 1px, transparent 1px 7px)",
                  }}
                />
                <span
                  className="absolute top-0 h-full w-[2px] -translate-x-1/2 bg-amber-300"
                  style={{
                    // 축이 뒤집혀 있다(왼쪽 끝이 최대 배율) — 위 드래그 방향과 짝이다.
                    left: `${(1 - (zoom - zoomRange.min) / (zoomRange.max - zoomRange.min)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={hasCameraError}
              aria-label="줌 배율"
              // 기기 범위를 그대로 쓰므로 value가 100~400 같은 값일 수 있다. 스크린리더가
              // 화면의 배지와 다른 숫자를 읽지 않도록 배율로 환산해 들려준다.
              aria-valuetext={`${zoomRatio.toFixed(1)}배`}
              // 축이 뒤집힌 화면과 화살표 키를 맞춘다 — rtl이면 ArrowRight가 min 방향으로
              // 매핑돼 마커도 오른쪽(축소)으로 간다. value/aria 의미는 그대로다.
              dir="rtl"
              // 포인터 조작은 위 래퍼가 상대 드래그로 처리한다. 이 range는 지우지 않는다 —
              // Tab 포커스와 화살표 키, 스크린리더의 slider 시맨틱이 여기 달려 있다.
              className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleShutter}
          disabled={hasCameraError || isCapturing}
          aria-label="촬영"
          aria-busy={isCapturing}
          className={`${BRUTAL} h-16 w-16 rounded-full transition-transform duration-150 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed ${
            hasCameraError || isCapturing ? "bg-neutral-300" : "bg-violet-200"
          }`}
        />
      </div>
    </div>
  );
};
