---
name: project-lint-debt
description: cloud 저장소는 npm run lint가 diff와 무관하게 repo 전체에서 이미 실패한다 — diff 스코프로 격리해서 봐야 한다
metadata:
  type: project
---

`npm run lint`를 그냥 돌리면 이 저장소는 어떤 diff든 상관없이 200개 이상의 기존 위반(주로 `no-restricted-syntax`의 화살표 함수 강제, `@typescript-eslint/naming-convention`의 boolean 변수 접두사 규칙(`is/has/should/...`), `prettier/prettier`)으로 이미 실패한다. 2026-08-31 확인 시점 기준 `git stash`로 클린 HEAD에서 돌려도 247개 에러가 난다 — eslint.config.mjs가 먼저 엄격해지고 기존 코드가 아직 마이그레이션 안 된 상태.

**Why:** 이 상태에서 diff를 리뷰할 때 `npm run lint` 전체 출력만 보고 "lint 실패 = 이 diff가 깨졌다"고 결론 내리면 오탐이다. 이번 리뷰(CameraView.tsx, use-cloud-entries.ts 수정)에서도 두 파일 다 lint 에러가 있었지만, `git stash`로 diff 적용 전/후를 비교해보니 새 코드는 오히려 에러를 줄였다(18→10개, import type 정리 + prettier 포맷 수정 포함) — 남은 에러는 전부 diff 이전부터 있던 것.

**How to apply:** 앞으로 리뷰할 때 `npm run lint` 전체 결과 대신, 변경된 파일만 `npx eslint <파일...>`로 돌리고, 필요하면 `git stash -u` → 같은 명령 → `git stash pop`으로 전/후를 비교해서 **이 diff가 새로 추가한 위반인지**를 확인한다. 새로 추가된 것만 지적하고, 기존부터 있던 건 "pre-existing, 이 diff 범위 밖"이라고 명시하되 굳이 매번 다시 지적하지 않는다. repo 전체 lint 부채를 이 diff의 책임으로 묻지 않는다 — 그건 별도 정리 작업(`docs/CONVENTIONS.md`가 이미 "죽은 코드는 주기적으로 정리" 원칙을 언급하듯, lint 부채도 별도 세션에서 다룰 사안).
