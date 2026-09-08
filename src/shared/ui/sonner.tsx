"use client";

import type { CSSProperties } from "react";
import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// 에러 메시지의 공통 채널. 화면 위에서 잠깐 떴다 사라진다 — 어떤 에러가 토스트고 어떤 게
// 화면 상태로 남아야 하는지는 → docs/UI-SYSTEM.md "토스트".
//
// unstyled로 두고 클래스를 전부 우리가 준다. 기본 스타일(둥근 모서리 + soft shadow + CSS 변수
// 배경)을 켜두면 Tailwind 클래스와 같은 속성을 두고 부딪혀 브루탈 톤이 반쯤만 먹는다.
//
// 카메라 뷰파인더 위에도 뜬다 — 뒤가 사용자가 찍는 하늘이라 밝기를 예측할 수 없어서
// 딤에 기대지 않고 불투명 대지 + 검은 테두리로 읽히게 한다.
const TOAST_BASE =
  "flex w-full items-start gap-2.5 border-[3px] border-black px-4 py-3 text-sm font-extrabold text-black shadow-[5px_5px_0_0_#000]";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      // 상단 헤더를 살짝 덮으며 내려온다 — 잠깐 뜨는 알림이라 자리를 비켜주기보다 눈에 닿는 쪽.
      offset={16}
      // sonner의 live region은 하나뿐이고 polite 고정이다(라이브러리 구현) — 동작이 막힌 이유를
      // assertive로 끊어 읽게 할 수 없으니, 대신 기본 4초보다 길게 잡아 읽힐 시간을 준다.
      duration={5000}
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // 대지 색은 타입별 클래스에만 둔다 — 베이스에 bg를 같이 넣으면 같은 속성을 두고
          // 부딪혀 생성 순서에 따라 흰 대지가 이긴다(실제로 겪음).
          toast: TOAST_BASE,
          default: "bg-white",
          error: "bg-rose-200",
          success: "bg-violet-200",
          warning: "bg-amber-300",
          info: "bg-sky-200",
          icon: "mt-0.5 flex-none",
          content: "min-w-0",
          description: "font-bold text-neutral-700",
        },
      }}
      style={{ "--width": "min(22rem, calc(100vw - 2rem))" } as CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
