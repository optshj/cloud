"use client";

import { useEffect, useState } from "react";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOffIcon, RefreshIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";

// 카메라 권한은 mount 시, 위치 권한은 셔터를 눌러야 처음 요청되던 게 문제였다
// (촬영 버튼을 누르는 순간 위치 팝업이 튀어나와 흐름이 끊김) — 실제 촬영 플로우로
// 들어가기 전에 둘 다 한 번에 요청해서 셔터 시점엔 다시 안 뜨게 만드는 게이트.
const requestBothPermissions = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });
  // 권한 확인이 목적이라 스트림은 바로 반납한다 — 실제 프리뷰는 CameraLive가 다시 연다.
  stream.getTracks().forEach((t) => t.stop());

  await new Promise<void>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("위치 서비스를 지원하지 않는 브라우저예요"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      () => reject(new Error("위치 권한이 거부됐어요")),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  });
};

export const CapturePermissionGate = ({
  onGranted,
}: {
  onGranted: () => void;
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    // iOS/macOS Safari는 permissions.query에 "camera"를 못 알아듣는 PermissionName으로 취급해서
    // Promise를 reject하는 게 아니라 호출 자체를 동기적으로 throw한다 — .catch()로는 못 잡는다.
    // try/catch로 감싸서 그럴 땐 체크를 그냥 건너뛰고 버튼을 눌러 실제 요청 결과로 판단하게 둔다.
    let isCancelled = false;
    (async () => {
      try {
        if (!navigator.permissions) return;
        const camera = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        const geolocation = await navigator.permissions.query({
          name: "geolocation",
        });
        if (
          !isCancelled &&
          camera.state === "granted" &&
          geolocation.state === "granted"
        ) {
          onGranted();
        }
      } catch {
        // 지원 안 하는 브라우저 — 조용히 무시, 버튼으로 실제 요청 결과를 본다.
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [onGranted]);

  const handleRequest = async () => {
    setIsRequesting(true);
    setIsDenied(false);
    try {
      await requestBothPermissions();
      onGranted();
    } catch (err) {
      console.error("capture-cloud: 카메라/위치 권한 요청 실패", err);
      setIsDenied(true);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className={`${BRUTAL_SM} rounded-full bg-white p-3`}>
        <CameraOffIcon className="h-8 w-8 text-sky-300" />
      </div>
      <p className="text-sm font-bold">
        {isDenied ? (
          <>
            카메라와 위치 권한이 필요해요.
            <br />
            브라우저 설정에서 허용해주세요.
          </>
        ) : (
          <>
            카메라와 위치 권한이 필요해요
            <br />
            촬영과 위치 기록을 위해 먼저 허용해주세요
          </>
        )}
      </p>
      <Button
        variant="thin"
        onClick={handleRequest}
        disabled={isRequesting}
        aria-busy={isRequesting}
        className="gap-1.5 py-1.5"
      >
        {isDenied && <RefreshIcon className="h-3.5 w-3.5" />}
        {isDenied ? "다시 시도" : "권한 허용하기"}
      </Button>
    </div>
  );
};
