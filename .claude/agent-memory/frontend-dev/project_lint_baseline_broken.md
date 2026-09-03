---
name: project-lint-baseline-broken
description: 예전엔 npm run lint가 clean main에서도 실패했지만 2026-09-03에 0건이 됐다 — 이제 완료 기준은 "레포 전체 0건"
metadata:
  type: project
---

**`npm run lint`는 이제 0건으로 통과한다.** (2026-09-03, 커밋 `3835e20`)

2026-09-01까지는 clean `main`에서도 285건이 나서 "내 diff의 파일만 깨끗하면 된다"가 현실적인
완료 기준이었다. **그 기준은 폐기다** — 지금은 `npm run lint`가 통째로 0건이고, 작업을 마쳤을 때
그대로 0건이어야 한다. 실패하면 내가 만든 것이다.

없어진 원인들: 함수 선언식(`export function X`)은 41곳 전부 화살표로 전환했고, prettier는 설정
파일명(`prettierrc.yaml` → `.prettierrc.yaml`)을 고쳐 이제 실제로 동작한다.

**주의 — `--fix`의 성격이 바뀌었다.** 예전엔 디렉터리에 `--fix`를 돌리면 무관한 파일이 대량
재포맷돼서 진짜 diff가 묻혔다. 지금은 레포가 이미 포맷된 상태라 그 위험이 없다. 다만
`prettier-plugin-tailwindcss`가 살아 있어서 **Tailwind 클래스 순서를 임의로 배열하면 `--fix`가
정렬해버린다** — 순서에 의미를 담지 말 것.

**How to apply:** 작업 끝에 `npm run lint`(필요하면 `-- --fix`)를 돌려 0건을 확인한다.
`git stash`로 전/후를 비교하는 예전 절차는 더 필요 없다. 관련 원칙은
[[feedback-verify-in-browser-not-guess]].
