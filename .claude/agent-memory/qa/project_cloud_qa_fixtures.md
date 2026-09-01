---
name: project-cloud-qa-fixtures
description: What test data and environment behavior to expect during a cloud QA pass (as of 2026-09-01)
metadata:
  type: project
---

As of 2026-09-01, the `cloud` project's Supabase project already has real seeded data reachable anonymously (no login needed) — `/feed` shows 3 entries (제주시 이도이동, dated 2026-08-28 ~ 2026-08-30), so `/calendar` shows them only when navigated to August, not the current month. Don't assume an empty feed/calendar means a bug — check month navigation and the actual entry dates first.

No test login account exists yet, so anything gated behind Kakao OAuth (좋아요 as a genuine logged-in user, 촬영 기록 저장, 탈퇴) has to stay skipped in QA reports — see [[feedback-adhoc-playwright-scripts]] for how ad-hoc scripts are run, since `npm run dev` + a plain Playwright script (not the regression suite) is the QA harness here.

Headless Chromium has no real camera, so `/` (CameraView) always falls through to the "카메라 권한이 필요해요" + 다시 시도 fallback — that's the app's designed permission-denied state, not a bug, and is as far as the camera flow can be exercised without a real device/camera stub.

**How to apply:** when QA-ing this repo, go straight to `/calendar` with month nav rather than assuming current month is representative, and don't re-litigate the camera-permission fallback as a defect.
