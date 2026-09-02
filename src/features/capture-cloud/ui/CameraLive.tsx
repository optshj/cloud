"use client";

import { useEffect, useRef, useState } from "react";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOffIcon, CloudIcon, RefreshIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { captureFrame } from "../lib/capture-frame";

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.1;

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
      // 진입 게이트에서 이미 한 번 받아둔 좌표를 재사용한다 — maximumAge가 기본값 0이면
      // granted 상태에서도 매번 새 fix를 기다려 셔터가 몇 초씩 멈춘다.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
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
  const [zoom, setZoom] = useState(ZOOM_MIN);
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

  const handleShutter = async () => {
    if (!videoRef.current) {
      return;
    }
    setLocationError(null);
    setIsCapturing(true);
    try {
      // 권한은 진입 게이트에서 이미 받아둬서 보통 즉시 돌아온다 — 셔터가 잠깐 비활성화되는
      // 것 외에 별도 진행 UI는 두지 않는다.
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
        {/* 평소엔 현재 배율만 보여주는 동그란 배지, 호버/드래그(포커스) 중에만 눈금 슬라이더로
            펼쳐진다 — iOS 카메라 줌과 같은 언어. 조작 자체는 계속 네이티브 range가 한다(투명하게
            줄 전체를 덮고 있어서 접힘/펼침에 상관없이 값 매핑이 동일하다). */}
        <div
          className={`group flex w-full max-w-[240px] flex-col items-center ${hasCameraError ? "pointer-events-none opacity-30" : ""}`}
        >
          <span
            aria-hidden
            className="mb-1 text-sm font-extrabold text-amber-300 opacity-0 transition-opacity duration-200 group-active:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
          >
            {zoom.toFixed(1)} x
          </span>
          <div className="relative flex h-11 w-full items-center justify-center">
            <div className="pointer-events-none relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black/55 transition-[width] duration-200 ease-out group-active:w-full group-focus-within:w-full group-hover:w-full">
              <span className="text-xs font-extrabold text-white transition-opacity duration-150 group-active:opacity-0 group-focus-within:opacity-0 group-hover:opacity-0">
                {Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}x
              </span>
              {/* 눈금과 range가 같은 폭(줄 전체)을 써야 인디케이터가 손가락과 어긋나지 않는다. */}
              <div className="absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-active:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100">
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
                    left: `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={hasCameraError}
              aria-label="줌 배율"
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
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
