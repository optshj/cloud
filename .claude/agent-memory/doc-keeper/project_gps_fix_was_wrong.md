---
name: gps-fix-was-wrong
description: 문서 두 곳이 나란히 적고 있던 GPS 노출 처방이 실제로는 피드를 죽이는 방법이었다 — 사실 확인 없이 병합했으면 못 잡았을 건
metadata:
  type: project
---

`ERD.md`와 백로그가 나란히 "`cloud_entries_select`를 `auth.uid() = user_id`로
좁혀 공개 조회를 `entry_feed`로만 몰아야 한다"고 적고 있었는데 **그 처방이 틀렸다.**
`entry_feed`가 `security_invoker = true`라 뷰 조회가 같은 RLS를 그대로 다시 타므로, 정책을
좁히면 뷰도 같이 좁아져 비로그인은 0행을 본다. 같은 ERD 문서 안의 "`security_invoker = true`가
왜 필수인가" 절과 정면으로 모순이었다. (2026-09-02, `api-developer` 실측 확인 → 커밋 `c01138f`)

**Why:** 두 자리가 **같은 말을 하고 있어서** 겉보기엔 드리프트가 아니었다. 중복만 보고
한쪽으로 병합했으면 틀린 처방이 유일한 진실 소스가 돼서 더 굳었을 것이다. 두 자리가 일치해도
그 내용이 **다른 절과 모순되는지**는 따로 봐야 한다.

**How to apply:** 문서에 적힌 "이렇게 고치면 된다"류 처방은 병합 전에 반드시 위임해서
확인한다(DB·RLS·Storage → `api-developer`, 화면 동작 → `frontend-dev`). 특히 같은 문서 안에
그 처방의 전제를 설명하는 절이 따로 있으면 서로 맞는지 대조한다. 틀린 처방은 삭제가 아니라
**정정으로 남긴다** — 안 그러면 다음 세션이 같은 처방을 다시 꺼낸다.
