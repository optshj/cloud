"use client";

import { useRef, useState } from "react";
import type { ComponentType, MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Heart, Images } from "lucide-react";
import { THEME, type ThemeKey } from "@/shared/ui/tokens";
import { usePageTransition } from "./PageTransition";

const TABS = [
  { href: "/calendar", label: "사진첩", Icon: Images, theme: "calendar" as ThemeKey },
  { href: "/", label: "카메라", Icon: Camera, theme: "camera" as ThemeKey },
  { href: "/feed", label: "피드", Icon: Heart, theme: "feed" as ThemeKey },
];

export const BottomNav = () => {
  const pathname = usePathname();
  // pathname은 wipe가 다 덮인 뒤에야 바뀌므로 누른 탭을 따로 든다.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isActive = (href: string) => {
    if (pendingHref) return href === pendingHref;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    // 떠 있는 nav — 각 화면이 이 높이(약 80px)만큼 아래 여백을 둬야 한다.
    <nav className="absolute inset-x-0 bottom-0 z-[60] flex items-end justify-around px-4 py-1">
      {TABS.map((tab) => (
        <NavTab
          key={tab.href}
          {...tab}
          active={isActive(tab.href)}
          onNavigate={() => setPendingHref(tab.href)}
        />
      ))}
    </nav>
  );
};

const NavTab = ({
  href,
  label,
  Icon,
  theme,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  theme: ThemeKey;
  active: boolean;
  onNavigate: () => void;
}) => {
  const t = THEME[theme];
  const isCamera = theme === "camera";
  const isActiveIconDark = theme === "calendar";
  const badgeRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const { triggerTransition } = usePageTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const isPlainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    if (!isPlainClick) return;
    e.preventDefault();
    if (active) return;

    onNavigate();

    if (badgeRef.current) {
      triggerTransition(badgeRef.current, theme, () => router.push(href));
    } else {
      router.push(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className="flex flex-1 flex-col items-center gap-1.5">
      {/* PRESS 토큰 금지 — duration이 부딪히고, 활성 탭을 누르면 들림이 눌림으로 튄다.
          키프레임도 금지 — 마운트마다 재생돼 두 번 튄다. */}
      <span
        ref={badgeRef}
        className={`flex items-center justify-center rounded-2xl border-[2.5px] border-black shadow-[3px_3px_0_0_#000] transition-transform duration-200 ease-out ${
          active ? "" : "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        } ${isCamera ? "h-12 w-12" : "h-11 w-11"} ${
          active ? `${t.navActive} -translate-y-2.5` : `${t.navIdle} translate-y-0`
        }`}
      >
        <Icon
          className={`${isCamera ? "h-6 w-6" : "h-5 w-5"} ${
            active && !isActiveIconDark ? "text-white" : "text-black"
          }`}
        />
      </span>
      <span className="relative inline-block">
        {active && (
          <span
            aria-hidden
            className={`absolute -inset-x-1.5 -inset-y-0.5 -z-10 -rotate-2 rounded-[3px] border-[1.5px] border-black ${t.navMark}`}
          />
        )}
        <span
          className={`relative text-[12.5px] ${active ? "font-extrabold" : "font-medium text-neutral-500"}`}
        >
          {label}
        </span>
      </span>
    </Link>
  );
};
