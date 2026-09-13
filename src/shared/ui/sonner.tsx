"use client";

import type { CSSProperties } from "react";
import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const TOAST_BASE =
  "flex w-full items-start gap-2.5 border-[3px] border-black px-4 py-3 text-sm font-extrabold text-black shadow-[5px_5px_0_0_#000]";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      offset={16}
      // live region이 polite 고정이라 기본 4초보다 길게 둔다.
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
          // bg는 타입별 클래스에만 — 베이스에 넣으면 흰색이 이긴다.
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
