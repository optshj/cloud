"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, HeartIcon, ImagesIcon } from "@/shared/ui/icons";
import { THEME } from "@/shared/ui/tokens";

const SIDE_TABS = [
  { href: "/calendar", label: "사진첩", Icon: ImagesIcon, activeBg: THEME.calendar.active, rotate: "-rotate-[7deg]" },
  { href: "/feed", label: "피드", Icon: HeartIcon, activeBg: THEME.feed.active, rotate: "rotate-[6deg]" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);
  const cameraActive = pathname === "/";

  return (
    <nav className="relative z-20 flex items-end justify-around border-t-[3px] border-black bg-white px-4 py-3.5">
      <SideTab {...SIDE_TABS[0]} active={isActive(SIDE_TABS[0].href)} />

      <Link href="/" aria-label="카메라" className="flex flex-1 flex-col items-center gap-1.5 active:scale-95">
        <span
          className={`flex h-[68px] w-[68px] -translate-y-7 items-center justify-center rounded-2xl border-[3px] border-black shadow-[3px_3px_0_0_#000] ${
            cameraActive ? "bg-sky-300" : "bg-white"
          }`}
        >
          <CameraIcon className="h-7 w-7" />
        </span>
        <span className={`-mt-3 text-[13px] ${cameraActive ? "font-extrabold" : "font-medium text-neutral-500"}`}>
          카메라
        </span>
      </Link>

      <SideTab {...SIDE_TABS[1]} active={isActive(SIDE_TABS[1].href)} />
    </nav>
  );
}

function SideTab({
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
}) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-1.5 active:scale-95">
      <span
        className={`flex items-center justify-center rounded-lg border-[3px] border-black px-2.5 py-2 shadow-[3px_3px_0_0_#000] ${rotate} ${
          active ? activeBg : "bg-white"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className={`text-[12.5px] ${active ? "font-bold" : "font-medium text-neutral-500"}`}>{label}</span>
    </Link>
  );
}
