---
name: playwright-e2e
description: cloud(구름 수집 서비스) 프로젝트에서 Playwright E2E 테스트를 작성할 때 사용. 설정은 `playwright.config.ts`(chromium 하나, `npm run dev` 자동 기동)가 이미 돼 있다. "e2e 테스트 만들어줘", "플로우 전체 테스트해줘" 같은 요청에 트리거.
---

# Playwright E2E (cloud)

## 실행

- `npm run test:e2e` — `playwright.config.ts`의 `webServer`가 `npm run dev`를 자동으로 띄우고 `http://localhost:3000`에 접속한다. 이미 dev 서버가 떠 있으면 그걸 재사용한다.

## 파일 위치

- `e2e/*.spec.ts`. `src/` 안의 `*.test.ts`(vitest)와 확장자로 구분되며, `vitest.config.mts`의 `include`가 `src/**/*.test.{ts,tsx}`로 좁혀져 있어 서로 겹치지 않는다 — 이 분리를 건드리지 않는다.

## 이 프로젝트에서 e2e로 뭘 볼지

실제 사용자 플로우(어떤 화면에서 어떤 순서로 움직이는지)는 `docs/FLOWS.md`가 기준 문서다 — spec을 쓰기 전에 먼저 읽고 거기 정리된 순서/분기를 따라간다.

- FLOWS.md의 흐름 중 로그인 없이 도달 가능한 구간만 e2e로 다룬다.
- 로그인이 필요한 구간(촬영→기록, 좋아요, 신고, 탈퇴 등)은 실제 카메라 하드웨어·Supabase 인증까지 필요해 지금 자동화 범위 밖이다. 억지로 인증을 모킹해서 만들지 않는다 — 필요해지면(테스트 계정·세션 주입 방식이 정해지면) 그때 확장한다.

## 완료 기준

새 spec을 추가했으면 `npm run test:e2e`로 통과를 확인한다. 전체 스위트가 3개 워커로 병렬 실행되니 테스트끼리 상태(예: 오늘의 기록)를 공유하지 않게 짠다.
