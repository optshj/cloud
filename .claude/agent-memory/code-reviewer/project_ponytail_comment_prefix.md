---
name: ponytail-comment-prefix
description: 전역 ponytail 플러그인 때문에 에이전트가 코드에 `// ponytail:` 접두 주석을 남긴다 — cloud 컨벤션이 아니니 리뷰에서 걷어낸다
metadata:
  type: project
---

사용자 전역에 ponytail 플러그인이 켜져 있어서, 하위 에이전트(frontend-dev 등)가 "의도적 단순화" 표시로 `// ponytail: ...` 주석을 코드에 남긴다. cloud 레포에는 이 접두 컨벤션이 없다(`grep -rn ponytail src app`로 확인).

**Why:** 2026-09-13 리뷰에서 `share-card.ts`에 `// ponytail: 즉시 revoke하면...`이 들어와 있었다. 내용(Safari blob URL gotcha)은 남길 가치가 있었고 접두만 이질적이었다. 사용자는 주석을 컨텍스트 비용으로 보고 줄이는 중이다.

**How to apply:** diff에 `ponytail:` 주석이 보이면 접두만 떼고(✅자동수정), 내용이 경위/서사뿐이면 주석째 지운다. Critical 아님.
