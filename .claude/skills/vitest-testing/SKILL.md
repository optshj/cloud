---
name: vitest-testing
description: cloud(구름 수집 서비스) 프로젝트에서 Vitest로 테스트를 작성할 때 사용. 설정은 `vitest.config.mts`(jsdom, `@/` alias, `@testing-library/jest-dom` 매처)가 이미 돼 있다. "테스트 작성해줘", "이 함수 테스트 커버해줘" 같은 요청에 트리거.
---

# Vitest 테스트 작성 (cloud)

## 실행

- `npm run test` — 1회 실행 (CI/리뷰 전 확인용)
- `npm run test:watch` — watch 모드

## 파일 위치·네이밍

- 테스트 대상 파일과 **co-location**: `foo.ts` → `foo.test.ts`.
- 컴포넌트 테스트도 동일: `Foo.tsx` → `Foo.test.tsx`.

## 우선순위 — 이 프로젝트에서 뭘 테스트할지

1인 MVP라 커버리지 숫자를 쫓지 않는다. **버그가 나면 조용히 틀리는 순수 로직**부터 우선한다.

- **먼저**: 자정 경계 처리(UTC/KST) 같은 날짜 계산, 좌표→동 변환처럼 조용히 틀릴 수 있는 순수 로직, Route Handler의 검증/에러 분기 로직.
- **나중/생략 가능**: 순수 프레젠테이션 컴포넌트(레이아웃만 있고 로직 없는 것), 이미 수동으로 확인한 카메라 캡처 같은 브라우저 API 의존 코드(jsdom에서 `getUserMedia` 등은 흉내내기 어렵다 — 억지로 모킹하지 않는다).

## 컴포넌트 테스트

`@testing-library/react` + `@testing-library/jest-dom`(matcher는 `vitest.setup.ts`에서 이미 로드됨). 구현 디테일(내부 state)이 아니라 사용자가 보는 결과(텍스트, role, aria)를 기준으로 검증한다.

## Supabase/외부 API 모킹

`entities/*/model/*.api.ts`와 Route Handler는 `@/shared/lib/supabase/{client,server,admin}`을 직접 import한다. 테스트에서는 `vi.mock("@/shared/lib/supabase/server")`처럼 모듈 단위로 모킹하고, `supabase-patterns` 스킬에 있는 실제 호출 패턴(인증 체크 → 검증 → 재계산 → 응답)을 기준으로 각 분기를 검증한다.

## 완료 기준

새 테스트를 추가했으면 `npm run test`로 통과를 확인한다. 기존 테스트를 건드리지 않았다면 전체 스위트를 다시 훑을 필요는 없다.
