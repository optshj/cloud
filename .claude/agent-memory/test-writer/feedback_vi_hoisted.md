---
name: feedback-vi-hoisted
description: cloud 프로젝트에서 Route Handler를 vi.mock으로 테스트할 때 mock 변수는 반드시 vi.hoisted()로 선언
metadata:
  type: feedback
---

`app/api/**/route.ts`처럼 여러 모듈(`@/shared/lib/supabase/server`, `@/shared/lib/kakao/reverse-geocode`, `@/shared/lib/date`, `@/features/capture-cloud/lib/generate-ai-comment`)에 의존하는 Route Handler를 테스트할 때, `vi.mock(path, factory)`의 factory 안에서 파일 상단의 `const mockX = vi.fn()`을 참조하면 `vi.mock` 호출이 파일 최상단으로 호이스팅되기 때문에 TDZ `ReferenceError`가 날 수 있다.

**Why:** Vitest는 `vi.mock()` 호출을 정적으로 감지해 import보다도 앞으로 끌어올린다. factory가 참조하는 `const`가 소스 코드상 위에 있어도, 실제 실행 순서는 hoist된 `vi.mock()`이 먼저이므로 그 시점엔 아직 초기화되지 않은 상태다.

**How to apply:** factory에서 참조할 mock 함수는 항상 `vi.hoisted(() => ({ mockA: vi.fn(), mockB: vi.fn() }))`로 만들고 그 결과를 구조분해해서 쓴다. [[project-vitest-include-gap]]과 함께 이 프로젝트의 Route Handler 테스트(예: `app/api/entries/{preview,confirm}/route.test.ts`) 작성 시 기본 패턴으로 삼는다.
