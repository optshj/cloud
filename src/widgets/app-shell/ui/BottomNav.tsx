"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, HeartIcon, ImagesIcon } from "@/shared/ui/icons";
import { THEME } from "@/shared/ui/tokens";

const SIDE_TABS = [
  {
    href: "/calendar",
    label: "사진첩",
    Icon: ImagesIcon,
    activeBg: THEME.calendar.active,
    rotate: "-rotate-[7deg]",
  },
  {
    href: "/feed",
    label: "피드",
    Icon: HeartIcon,
    activeBg: THEME.feed.active,
    rotate: "rotate-[6deg]",
  },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);
  const cameraActive = pathname === "/";

  return (
    <nav className="relative z-20 flex items-center justify-around border-t-[3px] border-black bg-white px-4 py-1">
      <SideTab {...SIDE_TABS[0]} active={isActive(SIDE_TABS[0].href)} />

      {/* nav 높이에 영향 안 주도록 absolute로 띄운다 — 박스가 flow에 잡히면 그 높이만큼 bar가 커진다.
          absolute라 위치는 DOM 순서와 무관하지만, 탭/스크린리더 순서를 시각 순서(사진첩→카메라→피드)와
          맞추려면 여기(두 SideTab 사이)에 있어야 한다. */}
      <Link
        href="/"
        aria-label="카메라"
        className="absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-[28%] flex-col items-center gap-1 active:scale-95"
      >
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-black shadow-[3px_3px_0_0_#000] ${
            cameraActive ? "bg-sky-300" : "bg-white"
          }`}
        >
          <CameraIcon className="h-6 w-6" />
        </span>
        <span
          className={`text-[13px] ${cameraActive ? "font-extrabold" : "font-medium text-neutral-500"}`}
        >
          카메라
        </span>
      </Link>

      {/* 카메라 버튼이 absolute라 flow에 안 잡힌다 — 양옆 탭이 가운데로 쏠리지 않도록 자리만 잡아준다. */}
      <div aria-hidden className="flex-1" />
      <SideTab {...SIDE_TABS[1]} active={isActive(SIDE_TABS[1].href)} />
    </nav>
  );
};

const SideTab = ({
  href,
  label,
  Icon,
  activeBg,
  rotate,
  active,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  activeBg: string;
  rotate: string;
  active: boolean;
}) => {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-1.5 active:scale-95">
      <span
        className={`flex items-center justify-center rounded-lg border-[3px] border-black px-2.5 py-1.5 shadow-[3px_3px_0_0_#000] ${rotate} ${
          active ? activeBg : "bg-white"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className={`text-[12.5px] ${active ? "font-bold" : "font-medium text-neutral-500"}`}>
        {label}
      </span>
    </Link>
  );
};
