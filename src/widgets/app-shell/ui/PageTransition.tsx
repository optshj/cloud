"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { THEME, type ThemeKey } from "@/shared/ui/tokens";

// 프로토타입에서 검증된 값 — 임의로 조정하지 않는다.
const WIPE_SIZE = 64;
const FADE_DELAY_MS = 80;
const FADE_DURATION_MS = 180;
// 목적지 화면이 이 시간 안에 준비(setPageReady(true))를 못 알리면, 계속 덮여있지
// 않도록 강제로 걷어낸다 — 네트워크 문제로 로딩이 끝없이 길어지는 상황의 안전장치.
const MAX_COVER_WAIT_MS = 4000;

// onCovered는 원이 화면을 다 덮은 시점에 불린다 — 실제 라우트 이동은 여기서 해야
// "이미 바뀐 화면 위에서 뒤늦게 애니메이션만 재생되는" 어색함이 없다.
type TriggerTransition = (originEl: HTMLElement, theme: ThemeKey, onCovered: () => void) => void;

const PageTransitionContext = createContext<TriggerTransition | null>(null);
// 목적지 화면이 자기 로딩이 끝났음을 알리는 채널 — 덮여있는 동안 진짜로 로딩이
// 끝나야 걷히게 하려면(스켈레톤이 뒤에 가려진 채로 실제 로딩이 이루어져야) 필요하다.
const SetPageReadyContext = createContext<((isReady: boolean) => void) | null>(null);

export const usePageTransition = () => {
  const triggerTransition = useContext(PageTransitionContext);
  if (!triggerTransition) {
    throw new Error("usePageTransition은 PageTransitionProvider 내부에서만 쓸 수 있습니다.");
  }
  return { triggerTransition };
};

// 각 View가 자신의 로딩 상태를 그대로 넘기면 된다: usePageReady(!isLoading).
// PageTransitionProvider 밖(예: 스토리북)에서도 안전하게 no-op으로 동작한다.
// 계약: BottomNav 탭(카메라/사진첩/피드)이 이동하는 View는 반드시 이 훅을 호출해야
// 한다 — 기본값이 "안 준비됨"이라, 안 부르면 그 화면으로의 모든 전환이 매번
// MAX_COVER_WAIT_MS(4초)를 다 채우고서야 걷힌다. 놓쳐도 lint/타입에서 안 걸린다.
export const usePageReady = (isReady: boolean) => {
  const setPageReady = useContext(SetPageReadyContext);
  useEffect(() => {
    setPageReady?.(isReady);
  }, [isReady, setPageReady]);
};

// wipe 배경색은 THEME.body(bg-[#xxxxxx] 형태)에서 그대로 뽑아 쓴다 — 별도 hex 토큰을
// 새로 두면 두 값이 어긋날 수 있다(오버레이가 덮는 색과 실제 페이지 배경색은 반드시 일치해야 함).
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
  // 화면이 다 덮인 뒤 목적지가 준비되길 기다리는 콜백 — setPageReady(true)가 이걸 부른다.
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

    // 애니메이션을 못 그리거나(엘리먼트 못 찾음) 재생 안 할 상황(reduced motion)이면
    // 연출 없이 바로 이동만 시킨다 — 어떤 경우에도 라우팅 자체는 보장한다.
    if (!wrapper || !wipe || !frameEl || isReducedMotion) {
      onCovered();
      return;
    }

    // 연타로 재트리거될 때 이전 애니메이션의 리스너/타이머가 겹치지 않게 먼저 정리한다.
    cleanupRef.current?.();
    // 이전 화면이 준비 상태였더라도 이번 전환에서는 목적지가 새로 알려줄 때까지 기다린다.
    isPageReadyRef.current = false;
    onPageReadyRef.current = null;

    const frameRect = frameEl.getBoundingClientRect();
    // 오버레이 래퍼도 CSS(mx-auto max-w-md)로 따로 흉내내지 않고, 실제 측정한
    // app-frame 사각형에 그대로 맞춘다 — 두 박스가 CSS 트릭으로 "우연히" 같은
    // 위치에 오길 바라면, 스크롤바 등 아주 작은 오차로도 한쪽 귀퉁이가 안 덮인다.
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
    const scaleEnd = (maxDist / (WIPE_SIZE / 2)) * 1.15;

    wipe.style.left = `${x}px`;
    wipe.style.top = `${y}px`;
    wipe.style.background = getBodyColor(theme);
    wipe.style.opacity = "1";
    wipe.style.transition = "none";
    wipe.style.transform = "translate(-50%, -50%) scale(0)";
    void wipe.offsetHeight; // reflow 강제 — transition:none이 실제로 적용된 뒤에 다음 단계로 넘어가게

    wipe.style.transition = "transform 1.05s cubic-bezier(0.32, 0.72, 0.18, 1)";
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

      // 화면이 다 덮인 지금 실제로 페이지를 이동시킨다 — 그래야 wipe가 걷힐 때
      // 진짜로 "바뀌는" 게 보인다. 목적지가 준비됐다고 알려올 때까지는 덮은 채로
      // 기다린다 — 스켈레톤이 아니라 이 원이 곧 로딩 상태다.
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
