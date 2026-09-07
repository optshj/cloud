"use client";

import { useRef } from "react";
import type { ComponentType, MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, Heart, Images } from "lucide-react";
import { PRESS, THEME, type ThemeKey } from "@/shared/ui/tokens";
import { usePageTransition } from "./PageTransition";

const TABS = [
  { href: "/calendar", label: "사진첩", Icon: Images, theme: "calendar" as ThemeKey },
  { href: "/", label: "카메라", Icon: Camera, theme: "camera" as ThemeKey },
  { href: "/feed", label: "피드", Icon: Heart, theme: "feed" as ThemeKey },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="relative z-[60] flex items-end justify-around px-4 py-1">
      {TABS.map((tab) => (
        <NavTab key={tab.href} {...tab} active={isActive(tab.href)} />
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
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  theme: ThemeKey;
  active: boolean;
}) => {
  const t = THEME[theme];
  const isCamera = theme === "camera";
  // 옐로(사진첩)는 활성 배경도 밝아서 아이콘을 검정으로 유지한다 — 나머지는 배경이 짙어지니 흰색으로 뒤집는다.
  const isActiveIconDark = theme === "calendar";
  const badgeRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const { triggerTransition } = usePageTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const isPlainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    if (!isPlainClick) return; // ctrl/cmd/shift/middle-click 등은 Link 기본 동작(새 탭 열기)을 그대로 둔다
    e.preventDefault();
    if (active) return; // 이미 활성화된 탭 재클릭 — 전환/이동 없음

    if (badgeRef.current) {
      // 실제 이동은 화면이 다 덮인 뒤(onCovered)에 일어난다 — 배지를 못 찾은 경우에만 즉시 이동.
      triggerTransition(badgeRef.current, theme, () => router.push(href));
    } else {
      router.push(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className="flex flex-1 flex-col items-center gap-1.5">
      <span
        ref={badgeRef}
        className={`${PRESS} flex items-center justify-center rounded-2xl border-[2.5px] border-black shadow-[3px_3px_0_0_#000] transition-transform duration-200 ease-out ${
          isCamera ? "h-12 w-12" : "h-11 w-11"
        } ${active ? `${t.navActive} animate-nav-rise -translate-y-2.5` : `${t.navIdle} translate-y-0`}`}
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
