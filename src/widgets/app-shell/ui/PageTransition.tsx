"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { THEME, type ThemeKey } from "@/shared/ui/tokens";

// 프로토타입에서 검증된 값 — 임의로 조정하지 않는다.
const WIPE_SIZE = 64;
const FADE_DELAY_MS = 80;
const FADE_DURATION_MS = 180;
const MAX_COVER_WAIT_MS = 4000;

type TriggerTransition = (originEl: HTMLElement, theme: ThemeKey, onCovered: () => void) => void;

const PageTransitionContext = createContext<TriggerTransition | null>(null);
const SetPageReadyContext = createContext<((isReady: boolean) => void) | null>(null);

export const usePageTransition = () => {
  const triggerTransition = useContext(PageTransitionContext);
  if (!triggerTransition) {
    throw new Error("usePageTransition은 PageTransitionProvider 내부에서만 쓸 수 있습니다.");
  }
  return { triggerTransition };
};

// BottomNav 탭 대상 View는 반드시 호출한다 — 안 부르면 전환마다 MAX_COVER_WAIT_MS를 다 채운다.
export const usePageReady = (isReady: boolean) => {
  const setPageReady = useContext(SetPageReadyContext);
  useEffect(() => {
    setPageReady?.(isReady);
  }, [isReady, setPageReady]);
};

const getBodyColor = (theme: ThemeKey) => {
  const hex = THEME[theme].body.match(/#[0-9a-fA-F]{6}/)?.[0];
  if (!hex) {
    console.warn(`[PageTransition] THEME.${theme}.body에서 hex를 못 찾았다 — 흰색으로 폴백한다.`);
  }
  return hex ?? "#ffffff";
};

export const PageTransitionProvider = ({ children }: { children: ReactNode }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isPageReadyRef = useRef(false);
  const onPageReadyRef = useRef<(() => void) | null>(null);

  const setPageReady = useCallback((isReady: boolean) => {
    isPageReadyRef.current = isReady;
    if (isReady) {
      onPageReadyRef.current?.();
    }
  }, []);

  const triggerTransition = useCallback<TriggerTransition>((originEl, theme, onCovered) => {
    const wrapper = wrapperRef.current;
    const wipe = wipeRef.current;
    const frameEl = document.getElementById("app-frame");
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!wrapper || !wipe || !frameEl || isReducedMotion) {
      onCovered();
      return;
    }

    cleanupRef.current?.();
    isPageReadyRef.current = false;
    onPageReadyRef.current = null;

    const frameRect = frameEl.getBoundingClientRect();
    // CSS로 흉내내지 않고 실측 사각형에 맞춘다 — 스크롤바 오차로도 귀퉁이가 안 덮인다.
    wrapper.style.left = `${frameRect.left}px`;
    wrapper.style.top = `${frameRect.top}px`;
    wrapper.style.width = `${frameRect.width}px`;
    wrapper.style.height = `${frameRect.height}px`;

    const originRect = originEl.getBoundingClientRect();
    const x = originRect.left + originRect.width / 2 - frameRect.left;
    const y = originRect.top + originRect.height / 2 - frameRect.top;

    const corners: Array<[number, number]> = [
      [0, 0],
      [frameRect.width, 0],
      [0, frameRect.height],
      [frameRect.width, frameRect.height],
    ];
    const maxDist = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y)));
    // 1.7배: 노이즈 필터(±24px)가 둘레를 파먹어도 먼 모서리까지 덮이게. 바꾸면 1.55s도 같은 비율로.
    const scaleEnd = (maxDist / (WIPE_SIZE / 2)) * 1.7;

    wipe.style.left = `${x}px`;
    wipe.style.top = `${y}px`;
    wipe.style.background = getBodyColor(theme);
    wipe.style.opacity = "1";
    wipe.style.transition = "none";
    wipe.style.transform = "translate(-50%, -50%) scale(0)";
    void wipe.offsetHeight; // reflow 강제 — transition:none을 먼저 적용

    wipe.style.transition = "transform 1.55s cubic-bezier(0.32, 0.72, 0.18, 1)";
    const rafId = requestAnimationFrame(() => {
      wipe.style.transform = `translate(-50%, -50%) scale(${scaleEnd})`;
    });

    const timeoutIds: number[] = [];

    const fadeOutAndReset = () => {
      wipe.style.transition = `opacity ${FADE_DURATION_MS}ms ease-out`;
      wipe.style.opacity = "0";

      const resetTimeoutId = window.setTimeout(() => {
        wipe.style.transition = "none";
        wipe.style.transform = "translate(-50%, -50%) scale(0)";
        wipe.style.opacity = "1";
      }, FADE_DURATION_MS);
      timeoutIds.push(resetTimeoutId);
    };

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      wipe.removeEventListener("transitionend", handleTransitionEnd);
      onCovered();

      const proceed = () => {
        onPageReadyRef.current = null;
        const fadeTimeoutId = window.setTimeout(fadeOutAndReset, FADE_DELAY_MS);
        timeoutIds.push(fadeTimeoutId);
      };

      if (isPageReadyRef.current) {
        proceed();
        return;
      }

      onPageReadyRef.current = proceed;
      const maxWaitId = window.setTimeout(() => {
        if (onPageReadyRef.current === proceed) {
          proceed();
        }
      }, MAX_COVER_WAIT_MS);
      timeoutIds.push(maxWaitId);
    };
    wipe.addEventListener("transitionend", handleTransitionEnd);

    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      wipe.removeEventListener("transitionend", handleTransitionEnd);
      onPageReadyRef.current = null;
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <PageTransitionContext.Provider value={triggerTransition}>
      <SetPageReadyContext.Provider value={setPageReady}>{children}</SetPageReadyContext.Provider>
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <filter id="paint-edge" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025 0.05"
              numOctaves={3}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={48}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div ref={wrapperRef} className="pointer-events-none fixed z-50 overflow-hidden">
        <div
          ref={wipeRef}
          aria-hidden="true"
          className="absolute h-16 w-16 rounded-full"
          style={{
            transform: "translate(-50%, -50%) scale(0)",
            transformOrigin: "center",
            filter: "url(#paint-edge)",
          }}
        />
      </div>
    </PageTransitionContext.Provider>
  );
};
