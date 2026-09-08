"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";

// 실제 사진이 없을 때(시드/목업 데이터) 그라데이션 배경 위에 구름 아이콘을 얹어 보여준다.
export const PlaceholderPhoto = ({
  photoDataUrl,
  className,
  alt = "",
}: {
  photoDataUrl?: string;
  className?: string;
  // 격자·카드에서는 부모 버튼의 aria-label이 사진을 대신 설명하므로 빈 값이 맞다.
  // 상세 모달처럼 사진 자체가 주 콘텐츠인 자리에서만 값을 넘긴다.
  alt?: string;
}) => {
  // Supabase Storage 사진은 네트워크로 받아오므로 도착 전까진 배경색만 덩그러니 남는다 —
  // 그동안 광택을 흘려 "로딩 중"임을 알리고, 도착하면 툭 튀지 않게 페이드인시킨다.
  const [isLoaded, setIsLoaded] = useState(false);

  // className으로 absolute 등 다른 position을 넘기면 Tailwind 클래스 병합 순서상 뒤에 나오는
  // "relative"가 항상 이겨서(둘 다 실려있으면 스타일시트 선언 순서가 우선) position:absolute가
  // 무력화되고 -inset-*이 박스를 안 채워 찌그러진다 — 넘어온 값이 없을 때만 relative를 기본값으로 쓴다.
  const hasPosition = /(?:^|\s)(?:absolute|fixed|sticky|static|relative)(?=\s|$)/.test(
    className ?? "",
  );

  return (
    <div
      className={`${hasPosition ? "" : "relative"} overflow-hidden bg-sky-100 ${className ?? ""}`}
    >
      {photoDataUrl ? (
        <>
          {!isLoaded && <span aria-hidden className="shimmer absolute inset-0 block" />}
          <img
            src={photoDataUrl}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover ${
              isLoaded ? "photo-fade-in" : "opacity-0"
            }`}
          />
        </>
      ) : (
        <Cloud
          className="absolute inset-0 m-auto h-1/3 w-1/3 text-white/60"
          fill="currentColor"
          strokeWidth={0}
        />
      )}
    </div>
  );
};
