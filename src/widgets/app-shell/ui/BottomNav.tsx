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
  // 실제 라우트 전환은 화면이 다 덮인 뒤에야 일어나 pathname이 한참 늦게 바뀐다 —
  // 누른 즉시 그 탭이 튀어오르게 하려면 pathname과 별개로 "방금 누른 탭"을 따로 든다.
  // 페이지가 바뀌면 이 BottomNav 자체가 새로 마운트되며 자연히 초기화된다.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isActive = (href: string) => {
    if (pendingHref) return href === pendingHref;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    // 배경 없이 콘텐츠 위에 떠 있다 — 흐름에서 빼야 뒤(카메라 뷰파인더 등)가 탭 뒤까지 차오른다.
    // 대신 각 화면이 이 높이(약 80px)만큼 아래 여백을 들고 있어야 마지막 요소가 안 가려진다.
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

    onNavigate(); // 배지가 실제 페이지 전환보다 먼저 튀어오른다 — 눌렀다는 반응은 즉시 와야 한다.

    if (badgeRef.current) {
      // 실제 이동은 화면이 다 덮인 뒤(onCovered)에 일어난다 — 배지를 못 찾은 경우에만 즉시 이동.
      triggerTransition(badgeRef.current, theme, () => router.push(href));
    } else {
      router.push(href);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className="flex flex-1 flex-col items-center gap-1.5">
      {/* pendingHref 덕에 클릭 즉시 이 인스턴스에서 active가 바뀌므로 transition-transform이
          진짜로 들어올려주는 걸 보여준다 — 새 페이지가 마운트된 뒤엔 이미 이 위치라 다시
          안 움직인다. (키프레임 방식은 마운트할 때마다 다시 재생돼 두 번 튀는 버그였다.)
          PRESS 토큰을 그대로 안 쓴다 — PRESS는 transition-transform duration-150을
          같이 갖고 있어서 여기 필요한 duration-200과 같은 속성을 두고 부딪힌다. 또
          PRESS의 active:translate-y-[2px]는 CSS 명시도상 -translate-y-2.5(들림)를
          항상 이겨서, 이미 선택된 탭을 누르고 있는 동안 들림→눌림으로 순간 튄다 —
          그 탭은 클릭해도 핸들러가 조기 리턴하는 no-op이니 눌림 신호 자체를 뺀다. */}
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
