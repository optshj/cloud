---
name: project-commit-automation
description: cloud CLAUDE.md에 2026-08-31 추가된 커밋/푸시 자동화 정책 — code-reviewer 통과 후 확인 없이 main에 직접 push
metadata:
  type: project
---

CLAUDE.md에 "커밋·푸시 자동화" 절이 추가됐다: `code-reviewer` 통과 → `gitmoji-commit` 스킬로 커밋 → **main에 직접 push까지 매번 확인 없이 진행**한다. 서브에이전트(`frontend-dev`/`api-developer`/`fix-qa-issue`)뿐 아니라 메인 세션이 직접 작업했을 때도 동일 적용. 예외(먼저 확인): 마이그레이션·스키마처럼 되돌리기 어려운 변경, `git push --force`, 이 규약 자체를 바꾸는 변경.

동시에 `qa`/`fix-qa-issue` 에이전트 쌍이 새로 생겼다 — `qa`는 실제 브라우저로 `docs/FLOWS.md` 플로우를 훑고 `qa-bug` 라벨 GitHub 이슈만 등록(코드 수정 안 함), `fix-qa-issue`는 그 이슈를 받아 `frontend-dev`/`api-developer`에게 위임하고 위임받은 에이전트가 커밋 메시지에 `Fixes #<n>`을 넣어 push하면 이슈가 자동으로 닫힌다.

**Why:** CI가 없는 저장소라 `code-reviewer` 1회 실행이 유일한 게이트라는 기존 정책([[project-lint-debt]] 참고 — 다만 lint는 여전히 diff 스코프로 봐야 함)을 유지한 채, 그 게이트를 통과하면 사람 확인 없이 바로 main에 반영되도록 파이프라인을 자동화한 것.

**How to apply:** 이 저장소에서 code-reviewer 역할을 수행할 때, **Critical(🔴)이 없다는 판단이 곧 실제로 main에 push된다는 뜻**이라는 걸 감안한다 — Warning/Suggestion 판단을 너무 관대하게 하면 그대로 배포된다. push를 막을 만큼 확신이 없는 이슈는 🟡/🟢로 남기되, 정말 스코프 가드레일·보안·되돌리기 어려운 변경이면 주저 없이 🔴로 명확히 표시한다.
