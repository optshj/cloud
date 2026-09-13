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

const DIGITAL_ZOOM_RANGE = { min: 1, max: 5, step: 0.1 };

const CAMERA_ERROR_MESSAGE: Record<string, string> = {
  NotAllowedError: "카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.",
  SecurityError: "카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.",
  NotReadableError: "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해주세요.",
  TrackStartError: "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해주세요.",
  NotFoundError: "이 기기에서 카메라를 찾지 못했어요.",
  DevicesNotFoundError: "이 기기에서 카메라를 찾지 못했어요.",
  default: "카메라를 열지 못했어요. 다시 시도해주세요.",
};

// zoom은 Image Capture 스펙이라 lib.dom 타입에 없다.
type ZoomCapabilities = MediaTrackCapabilities & { zoom?: Partial<ZoomRange> };

export type Coords = { lat: number; lng: number };

const COORDS_TIMEOUT_MS = 8000;
const COORDS_MAX_AGE_MS = 120_000;

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: COORDS_TIMEOUT_MS,
  // 기본값 0이면 매번 새 fix를 기다려 셔터가 몇 초씩 멈춘다.
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
  isPaused?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState(DIGITAL_ZOOM_RANGE.min);
  const [zoomRange, setZoomRange] = useState<ZoomRange>(DIGITAL_ZOOM_RANGE);
  const [isHardwareZoom, setIsHardwareZoom] = useState(false);
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
        // 실제 거부일 때만 — 다른 앱이 카메라를 잡은 경우까지 지우면 게이트가 다시 뜬다.
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

  // 위치 캐시 예열 — 셔터 요청이 maximumAge로 즉시 돌아오게 한다.
  // 게이트는 이미 granted면 좌표를 안 받으므로 여기서 해야 한다.
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
    // 트랙은 끄지 않고 재생만 멈춘다 — 끄면 재진입 때 권한·초기화를 다시 탄다.
    if (isPaused) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }
  }, [isPaused]);

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

  // 상대 드래그(절대 매핑이면 잡는 순간 값이 튄다). 네이티브 카메라 다이얼처럼 왼쪽 = 확대.
  const zoomDragRef = useRef<{ startX: number; startZoom: number } | null>(null);

  const handleZoomPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (hasCameraError) {
      return;
    }
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
    setZoom(zoomRange.min + Math.round((next - zoomRange.min) / zoomRange.step) * zoomRange.step);
  };

  const handleZoomPointerUp = () => {
    zoomDragRef.current = null;
  };

  // 기기 단위가 제각각(1~8, 100~400)이라 최소값 대비 배율로 보여준다.
  const zoomRatio = zoom / zoomRange.min;

  const handleShutter = async () => {
    if (!videoRef.current) {
      return;
    }
    setIsCapturing(true);
    try {
      const coords = await getCurrentPosition();
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
          <div className="pointer-events-none absolute right-4 bottom-28 z-10 h-12 w-12 border-r-4 border-b-4 border-black" />
        </>
      )}

      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-6 pb-28">
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
              aria-valuetext={`${zoomRatio.toFixed(1)}배`}
              // 반전된 축에 화살표 키 방향을 맞춘다.
              dir="rtl"
              // 포인터는 래퍼가 처리하지만 키보드·스크린리더 slider 시맨틱 때문에 지우지 않는다.
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
