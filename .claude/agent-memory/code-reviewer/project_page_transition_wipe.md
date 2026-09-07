---
name: page-transition-wipe
description: BottomNav 탭 전환 시 배지 위치에서 퍼지는 원형 wipe 애니메이션(PageTransition.tsx) — 명령형 DOM 조작과 몇 가지 알려진 결합 지점
metadata:
  type: project
---

`src/widgets/app-shell/ui/PageTransition.tsx`(2026-09-07 도입)는 하단 네비 탭 클릭 시
눌린 배지 위치를 원점으로 배경색이 원형으로 퍼지는 전환 애니메이션이다. React 컴포넌트 트리 밖에서
`document.getElementById` + 수동 `style.xxx` + `requestAnimationFrame`/`transitionend`/`setTimeout`
체인으로 구동한다 — 이례적이지만 의도적 선택(디자인은 아티팩트 프로토타입으로 이미 확정, 재조정 금지
주석 있음: `WIPE_SIZE`/`FADE_DELAY_MS`/`FADE_DURATION_MS`).

**Why:** 프레임 단위로 좌표를 잡고 transition을 강제로 리셋(`transition:none` → reflow → 다시
transition 설정)하는 패턴은 React state로 표현하면 매 프레임 리렌더가 생기거나 리셋 타이밍을
놓치기 쉽다. 순수 시각 효과(unmount 시 사라져도 무해)라 React 트리 밖에서 직접 처리하는 게
정당화된다 — 코드 리뷰에서 "왜 명령형이냐"는 반복 지적하지 않는다.

**연타/재트리거 정리는 안전하다 (검증됨):** `cleanupRef.current?.()`를 매 트리거 시작에서 먼저
호출해 이전 rAF/`transitionend` 리스너/타이머를 정리한다. Provider가 RootLayout에 상시
마운트(라우팅에도 안 사라짐)라 언마운트 cleanup 부재는 실질 위험 없음 — 지적할 필요 없음.

**알려진 결합 지점 (각각 독립적으로 재발 가능하니 diff가 건드리면 확인):**
1. `getBodyColor()`가 `THEME[theme].body` 문자열에서 정규식(`/#[0-9a-fA-F]{6}/`)으로 hex를
   뽑는다. `tokens.ts`의 `body` 필드가 그라데이션이나 Tailwind 팔레트 클래스(`bg-sky-50`)로
   바뀌면 매치 실패 → 조용히 `#ffffff` 폴백. 타입 레벨 보호 없음. `tokens.ts`의 `THEME.*.body`가
   바뀌는 diff는 이 정규식이 여전히 매치되는지 확인.
2. `id="app-frame"`(`AppShell.tsx`)과 `document.getElementById("app-frame")`
   (`PageTransition.tsx`)이 문자열로만 묶여 있다. 리네임해도 컴파일 에러 없이 조용히 no-op
   (애니메이션만 사라지고 `router.push`는 정상 — 심각도 낮음, 상수 추출은 제안 수준).
3. wipe의 fade-out은 고정 시간(`FADE_DELAY_MS` + `FADE_DURATION_MS` ≈ 260ms, 총 애니메이션
   ~1.3s)이고 **실제 라우트 전환/데이터 로딩 완료와 무관**하다. 목적지 화면이 그 안에 준비 안
   되면(느린 첫 로드 등) 로딩 스켈레톤이 wipe가 걷히면서 노출될 수 있다 — 아직 실사용에서
   확인된 버그는 아니고 구조적 리스크로만 기록.
