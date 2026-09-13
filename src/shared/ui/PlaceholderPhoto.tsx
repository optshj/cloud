"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";

export const PlaceholderPhoto = ({
  photoDataUrl,
  className,
  alt = "",
}: {
  photoDataUrl?: string;
  className?: string;
  alt?: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // relative를 항상 붙이면 넘어온 absolute가 스타일시트 순서에 져서 무력화된다.
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
