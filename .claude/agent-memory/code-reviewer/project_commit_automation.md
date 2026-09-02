---
name: project-commit-automation
description: cloud에서 code-reviewer 통과 후 커밋+push를 누가 하는지 — code-reviewer 자신은 안 한다, 위임한 agent가 한다
metadata:
  type: project
---

**정정 (2026-09-02, 현재 CLAUDE.md 재확인 결과):** 이전 버전의 이 메모는 "code-reviewer 통과 →
확인 없이 main push"가 code-reviewer 자신에게 적용되는 일반 규칙이라고 적어뒀는데, 실제
CLAUDE.md 라우팅 표를 다시 읽어보니 그렇지 않다. **커밋 + main push는 `fix-qa-issue`와
`doc-keeper`라는 특정 agent의 역할 정의에 명시된 것**이고("`code-reviewer` 통과 후 커밋 +
main에 직접 push까지 한다"), `code-reviewer` 자신의 role은 "리뷰해줘, 커밋/푸시 전"에 응답하는
것 — 즉 **리뷰만 하고 커밋/push는 하지 않는다.** 메인 세션이 직접 "리뷰해줘"라고 code-reviewer를
호출했을 때도 동일 — 리뷰 결과만 보고하고, 커밋 여부는 사용자나 호출한 상위 흐름이 결정한다.

**Why:** 이전 메모를 그대로 믿고 리뷰 통과 후 자동으로 커밋+push했다면 사용자 동의 없는 배포가
됐을 것 — 메모의 "before recommending from memory" 원칙대로 CLAUDE.md 원문을 다시 읽어서 정정함.

**How to apply:** code-reviewer로 호출됐을 때 Critical(🔴) 유무 판단은 여전히 신중하게 하되
([[project-lint-debt]] 참고), 리뷰 통과 자체가 push를 트리거하지 않는다 — Critical 자동수정을
했다면 "무엇을 고쳤는지"까지만 보고하고 커밋은 사용자가 명시적으로 요청할 때만 한다.
`fix-qa-issue`/`doc-keeper`처럼 역할 정의에 커밋+push가 명시된 agent가 code-reviewer를 호출하는
경우엔 그 agent 쪽에서 push를 수행하는 것이지 code-reviewer가 하는 게 아니다.
