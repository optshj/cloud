"use client";

import { useEffect, useRef, useState } from "react";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOffIcon, CloudIcon, RefreshIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { captureFrame } from "../lib/capture-frame";

const ZOOM_LEVELS = [1, 3, 5] as const;

export type Coords = { lat: number; lng: number };

const getCurrentPosition = (): Promise<Coords> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("위치 서비스를 지원하지 않는 브라우저예요"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("위치 확인에 실패했어요. 다시 시도해주세요.")),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  });

export const CameraLive = ({
  onCapture,
}: {
  onCapture: (photoDataUrl: string, coords: Coords) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState<(typeof ZOOM_LEVELS)[number]>(1);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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
        setHasCameraError(false);
      })
      .catch(() => setHasCameraError(true));

    return () => {
      isCancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [retryKey]);

  const handleShutter = async () => {
    if (!videoRef.current) {
      return;
    }
    setLocationError(null);
    setIsCapturing(true);
    try {
      // GPS 조회는 최대 8초까지 걸린다 — 그동안 버튼만 회색이면 멈춘 것처럼 보여서
      // 셔터 위에 진행 상태를 띄운다.
      const coords = await getCurrentPosition();
      const photoDataUrl = captureFrame(videoRef.current, zoom);
      onCapture(photoDataUrl, coords);
    } catch (err) {
      console.error("capture-cloud: 촬영 시 위치 조회 실패", err);
      setLocationError(
        err instanceof Error
          ? err.message
          : "위치 확인에 실패했어요. 다시 시도해주세요.",
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
          <CloudIcon className="absolute left-[8%] top-[38%] h-10 w-14 text-white" />
          <CloudIcon className="absolute left-[52%] top-[47%] h-14 w-20 text-white" />
        </div>
      )}
      {hasCameraError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL_SM} rounded-full bg-white p-3`}>
            <CameraOffIcon className="h-8 w-8 text-sky-300" />
          </div>
          <p className="text-sm font-bold">
            카메라 권한이 필요해요.
            <br />
            브라우저 설정에서 허용해주세요.
          </p>
          <Button
            variant="thin"
            onClick={() => {
              setIsVideoReady(false);
              setRetryKey((k) => k + 1);
            }}
            className="gap-1.5 py-1.5"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
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
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          />
          <div className="pointer-events-none absolute left-4 top-4 z-10 h-12 w-12 border-l-4 border-t-4 border-black" />
          <div className="pointer-events-none absolute bottom-6 right-4 z-10 h-12 w-12 border-b-4 border-r-4 border-black" />
        </>
      )}

      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pb-8 pt-6">
        <p role="status" className="min-h-4 text-xs font-bold text-rose-600">
          {locationError}
        </p>
        <div
          className={`flex items-center gap-6 ${hasCameraError ? "pointer-events-none opacity-30" : ""}`}
        >
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              disabled={hasCameraError}
              className={`px-1 text-base ${zoom === level ? "font-extrabold text-black" : "font-semibold text-black/40"}`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
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
          {isCapturing && (
            <p
              role="status"
              className={`${BRUTAL_SM} bg-white px-3 py-1 text-xs font-bold`}
            >
              위치 확인 중...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
