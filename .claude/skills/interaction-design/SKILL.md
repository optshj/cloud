---
name: interaction-design
description: cloud(구름 수집 서비스) 프로젝트에서 마이크로 인터랙션·모션(버튼 프레스, 모달 전환, 카드 스와이프, 좋아요 피드백 등)을 만들거나 다듬을 때 사용. "인터랙션 좋게 만들어줘", "버튼 눌리는 느낌", "모달 전환 애니메이션", "스와이프 추가" 같은 요청에 트리거. frontend-dev가 컴포넌트를 구현할 때 함께 참고한다.
---

# 인터랙션·모션 — cloud

`framer-motion`이 설치돼 있다(`package.json` 확인) — 시퀀스·제스처·enter/exit처럼 CSS만으로 다루기 번거로운 모션은 `framer-motion`을 쓴다. 단순 프레스 피드백(버튼 눌림 등)까지 `motion.div`로 감싸지 않는다 — 그 정도는 `active:` CSS transition으로 충분하다(ponytail 6번 규칙: 한 줄로 되면 한 줄로).

## 언제 framer-motion, 언제 CSS만

- **CSS transition/transform만**: 버튼/카드 프레스(`active:` 상태), 색·opacity 전환, 호버 대체 피드백. 컴포넌트에 상태나 조건부 마운트가 필요 없는 단순 인터랙션.
- **framer-motion**: 모달/시트 enter-exit(`AnimatePresence`), 리스트 아이템 추가/삭제, 카드 스와이프·드래그(`drag` prop), 순서가 있는 시퀀스 애니메이션. DOM 마운트/언마운트에 걸친 exit 애니메이션은 CSS만으로 안 되니 이때만 라이브러리를 쓴다.

## 톤 — 네오브루탈리즘은 "눌리는" 느낌이지 "부드러운" 느낌이 아니다

- 지속시간은 짧게: 120~200ms. `ease-out`(framer-motion에서는 `transition={{ duration: 0.15, ease: "easeOut" }}`) 위주. spring을 쓰더라도 `stiffness`를 높여 짧고 단단하게 — 길게 출렁이는 elastic/bounce는 브루탈리즘 톤과 안 맞는다.
- 버튼/카드 프레스 피드백은 `shared/ui/tokens.ts`의 `BRUTAL`/`BRUTAL_SM`(오프셋 하드섀도) 톤을 그대로 활용한다: `active:` 상태에서 섀도 오프셋만큼 `translate`시키고 섀도를 줄이면 "눌린" 느낌이 난다.
  ```
  className="translate-x-0 translate-y-0 shadow-[5px_5px_0_0_#000] transition-transform duration-150 ease-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_#000]"
  ```
- 새 모션 값은 `tokens.ts`에 상수로 추가한다(하드코딩 반복 금지) — 톤이 2곳 이상에서 쓰이면 그때 추가, 1곳뿐이면 인라인으로 충분(YAGNI).
- `motion.div`를 새로 쓸 leaf 컴포넌트에만 `"use client"`를 붙인다(`nextjs-app-router` 스킬) — framer-motion은 클라이언트 전용이다.

## `prefers-reduced-motion`

- CSS 모션은 `motion-safe:` 접두사로 감싸거나 `@media (prefers-reduced-motion: reduce)`로 지속시간을 0에 가깝게 낮춘다. 색/opacity 전환처럼 전정기관을 자극하지 않는 것은 예외.
- framer-motion 모션은 `useReducedMotion()` 훅으로 분기하거나, 앱 루트에 `MotionConfig reducedMotion="user"`를 한 번 걸어 전역으로 처리한다(컴포넌트마다 개별 분기하지 않는다 — 반복 코드).

## 터치 우선 (`accessibility` 스킬과 중복 확인)

- 호버로만 나타나는 피드백 금지 — 터치 기기에는 hover 상태가 없다. `active:`/`focus-visible:`로 대체한다.
- 스와이프/드래그(피드·사진첩 스택 뷰)는 세로 스크롤과 충돌하지 않게 방향을 명확히 구분한다. 임계값을 넘기 전엔 원위치로 스냅.

## 하지 않는 것

- 페이지 전체를 감싸는 라우트 전환 애니메이션, 스크롤 기반 인터랙션(패럴랙스 등) — 요청 없이 추가하지 않는다(스코프 밖).
- 모션을 위해 `"use client"`를 넓게 퍼뜨리지 않는다 — 인터랙션이 있는 최소 leaf 컴포넌트에만 붙인다(`nextjs-app-router` 스킬).
