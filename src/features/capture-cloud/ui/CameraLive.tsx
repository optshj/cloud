"use client";

import { useEffect, useRef, useState } from "react";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOffIcon, CloudIcon, RefreshIcon } from "@/shared/ui/icons";
import { captureFrame } from "../lib/capture-frame";

const ZOOM_LEVELS = [1, 3, 5] as const;

export type Coords = { lat: number; lng: number };

function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
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
}

export function CameraLive({ onCapture }: { onCapture: (photoDataUrl: string, coords: Coords) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState<(typeof ZOOM_LEVELS)[number]>(1);
  const [cameraError, setCameraError] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(false);
      })
      .catch(() => setCameraError(true));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [retryKey]);

  async function handleShutter() {
    if (!videoRef.current) return;
    setLocationError(null);
    setCapturing(true);
    try {
      const coords = await getCurrentPosition();
      const photoDataUrl = captureFrame(videoRef.current, zoom);
      onCapture(photoDataUrl, coords);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "위치 확인에 실패했어요. 다시 시도해주세요.");
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* 목업 장식용 구름 — 카메라 초기화 중에만 노출, 권한 거부 화면에는 안 띄운다 */}
      {!videoReady && !cameraError && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <CloudIcon className="absolute left-[8%] top-[38%] h-10 w-14 text-white" />
          <CloudIcon className="absolute left-[52%] top-[47%] h-14 w-20 text-white" />
        </div>
      )}
      {cameraError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className={`${BRUTAL_SM} rounded-full bg-white p-3`}>
            <CameraOffIcon className="h-8 w-8 text-sky-300" />
          </div>
          <p className="text-sm font-bold">
            카메라 권한이 필요해요.
            <br />
            브라우저 설정에서 허용해주세요.
          </p>
          <button
            type="button"
            onClick={() => {
              setVideoReady(false);
              setRetryKey((k) => k + 1);
            }}
            className={`${BRUTAL_SM} flex items-center gap-1.5 bg-white px-4 py-1.5 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setVideoReady(true)}
            className="absolute inset-0 z-[1] h-full w-full object-cover"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          />
          <div className="pointer-events-none absolute left-4 top-4 z-10 h-12 w-12 border-l-4 border-t-4 border-black" />
          <div className="pointer-events-none absolute bottom-6 right-4 z-10 h-12 w-12 border-b-4 border-r-4 border-black" />
        </>
      )}

      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pb-8 pt-6">
        {locationError && <p className="text-xs font-bold text-rose-600">{locationError}</p>}
        <div className={`flex items-center gap-6 ${cameraError ? "pointer-events-none opacity-30" : ""}`}>
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              disabled={cameraError}
              className={`px-1 text-base ${zoom === level ? "font-extrabold text-black" : "font-semibold text-black/40"}`}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleShutter}
          disabled={cameraError || capturing}
          aria-label="촬영"
          className={`${BRUTAL} h-16 w-16 rounded-full active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed ${
            cameraError || capturing ? "bg-neutral-300" : "bg-violet-200"
          }`}
        />
      </div>
    </div>
  );
}
