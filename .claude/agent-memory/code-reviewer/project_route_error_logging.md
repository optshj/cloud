---
name: route-error-logging-gap
description: Route Handler의 실패 분기가 원본 에러를 로그에 안 남기는 패턴이 반복된다 — 리뷰 때 모든 non-200 return 앞에 console.error가 있는지 훑는다
metadata:
  type: project
---

`app/api/**`와 `app/auth/callback`에서 **실패 분기가 원본 에러 객체를 버리고 사용자 문구만 반환하는** 패턴이 반복적으로 발견된다. 2026-09-09 전수 리뷰에서 4곳: `entries/confirm`의 insert 500, `account`의 `deleteUser` 실패, `account`의 storage `remove()` 결과 무시, `auth/callback`의 `exchangeCodeForSession` 결과 무시.

**Why:** 정상 경로와 부분 실패에는 로그를 잘 붙여두는데(역지오코딩 실패, 사진 경로 조회 실패에는 이유까지 적힌 `console.error`가 있다), **마지막 fallback 분기**에서만 빠진다. 그 분기가 정확히 재현이 제일 어려운 경로다. `docs/CONVENTIONS.md`와 `error-messages` 스킬이 명시적으로 금지하는 형태.

**How to apply:** 서버 리뷰에서 라우트를 볼 때 `grep -n "NextResponse.json({ error"` / `status: 500` 로 실패 분기를 먼저 뽑고, 각각 위에 `console.error("<route>: <동작>", ...)`가 있는지 짝을 맞춰 본다. supabase-js가 `{ error }`로 돌려주고 throw하지 않는 호출(`storage.remove`, `auth.exchangeCodeForSession`, `admin.auth.admin.deleteUser`)은 `await`만 하고 구조분해를 안 하면 조용히 삼켜지니 특히 본다.
