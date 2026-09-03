---
name: project-lint-debt
description: lint 부채는 2026-09-03에 0건으로 정리됐다 — 이제 npm run lint 실패는 그 diff가 깨뜨린 것이다
metadata:
  type: project
---

**`npm run lint`는 이제 레포 전체에서 0건이다.** (2026-09-03, 커밋 `3835e20`)

오랫동안 이 저장소는 어떤 diff든 상관없이 127~285건의 기존 위반으로 lint가 실패했고, 그래서
"lint 실패 = 이 diff가 깨졌다"가 오탐이었다. 그 전제가 끝났다 — **지금 `npm run lint`가 실패하면
그건 그 diff가 새로 만든 위반이다.** `git stash`로 전/후를 비교하는 절차는 더 필요 없다.

정리한 내용(커밋 `285fcbe`→`3835e20`): prettier 설정 파일명 수정 + `--fix` 자동 정리 +
함수 선언식 41곳 화살표 전환 + 불리언 접두사·max-params·set-state-in-effect 손질.

**prettier 설정이 이제 실제로 동작한다.** 루트 `prettierrc.yaml`에 앞 점이 없어 prettier가 파일을
못 찾던 것을 `.prettierrc.yaml`로 고쳤다. 값은 원래 의도(printWidth 200/single quote/semi:false)가
아니라 **이미 쓰여 있는 코드**에 맞췄다(double quote, 세미콜론, printWidth 100). 설정이 살아나면서
`prettier-plugin-tailwindcss`의 클래스 정렬도 같이 붙었다 — 그래서 클래스 순서를 임의로 바꾸면
prettier가 되돌린다.

**Why:** 이 저장소에 CI가 없어서 lint가 유일한 기계적 게이트다. 0건을 유지하지 않으면 몇 세션 만에
다시 수백 건이 쌓이고, 그 상태에선 아무도 lint 출력을 안 본다(직전 상태가 정확히 그거였다).

**How to apply:** 리뷰에서 `npm run lint`를 그대로 돌리고, 실패하면 **이 diff의 책임으로 본다** —
0건이 아니면 🔴. 재발 방지 장치(pre-commit 훅/CI)는 아직 안 붙였다(사용자 판단, `docs/TODO.md` §3-5).
