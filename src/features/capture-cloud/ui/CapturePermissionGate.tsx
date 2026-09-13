"use client";

import { useEffect, useState } from "react";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

const requestBothPermissions = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });
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

// 문서 단위로 통과를 기억해 탭 이동마다 게이트가 다시 뜨지 않게 한다.
// 모듈 상태라 쓰기는 effect/핸들러에서만(렌더에서 쓰면 서버에서 요청 간 오염).
let isGrantedInDocument = false;
export const hasCapturePermission = () => isGrantedInDocument;
export const forgetCapturePermission = () => {
  isGrantedInDocument = false;
};

export const CapturePermissionGate = ({ onGranted }: { onGranted: () => void }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    // Safari는 query({ name: "camera" })를 동기 throw한다 — .catch()가 아니라 try/catch.
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
        if (!isCancelled && camera.state === "granted" && geolocation.state === "granted") {
          isGrantedInDocument = true;
          onGranted();
        }
      } catch {
        // 미지원 — 버튼의 실제 요청 결과로 판단한다.
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
      isGrantedInDocument = true;
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
        <CameraOff className="h-8 w-8 text-sky-300" />
      </div>
      <p role="status" className="text-sm font-bold">
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
        className="gap-1.5"
      >
        {isDenied && <RefreshCw className="h-3.5 w-3.5" />}
        {isDenied ? "다시 시도" : "권한 허용하기"}
      </Button>
    </div>
  );
};
