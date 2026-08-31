---
name: project-vitest-include-gap
description: cloud 프로젝트 vitest.config.mts의 include가 app/**/route.ts 테스트를 빠뜨렸던 이력 — 이미 고쳐졌으니 되돌리지 말 것
metadata:
  type: project
---

`app/api/**/route.ts` (Next.js Route Handler)는 `src/` 밖, 저장소 루트의 `app/`에 있다. 그런데 `vitest.config.mts`의 `test.include`는 원래 `["src/**/*.test.{ts,tsx}"]`뿐이라 `app/api/entries/preview/route.test.ts`처럼 co-location으로 만든 테스트가 `npm run test`(vitest run)에서 아예 discover되지 않았다 — 조용히 스킵되어 통과한 것처럼 보이는 게 아니라 파일 자체가 실행 목록에 없었다.

2026-08-30에 `include`를 `["src/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"]`로 넓혀서 해결함 (`app/api/entries/preview/route.test.ts`, `app/api/entries/confirm/route.test.ts` 작성과 함께).

**Why:** `vitest-testing` 스킬 자체가 "먼저 테스트할 것"으로 `app/api/**/route.ts`의 검증/에러 분기 로직을 꼽는데, 원래 include 패턴으로는 그 우선순위 대상을 애초에 테스트할 수 없는 모순이 있었다. 이건 구현 코드가 아니라 테스트 하네스 설정이라 test-writer 권한 내에서 직접 고쳤다(구현 로직인 route.ts 자체는 건드리지 않음).

**How to apply:** `app/` 아래(또는 `src/` 밖 다른 경로) 새 co-located 테스트를 추가했는데 `npm run test`가 그 파일을 안 잡는 것 같으면, 먼저 `vitest.config.mts`의 `include`부터 확인한다 — 이미 `app/**/*.test.{ts,tsx}`가 포함돼 있어야 정상이니, 없다면 되돌려진 것이니 다시 추가한다. [[project-route-handler-tests]] 참고.
