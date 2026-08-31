---
name: project_router_back
description: cloud 프로젝트는 뒤로가기 닫기에 router.back() 대신 항상 명시적 router.push(목적지)를 쓴다 — 딥링크 가능한 라우트에서 router.back()이 깨질 수 있음
metadata:
  type: project
---

`app/feed/[id]/page.tsx`, `app/calendar/page.tsx` 같은 실제 Next.js 동적 라우트(URL로 직접 진입 가능 — `widgets/entry-card`가 `/feed/${entry.id}` 링크를 생성하므로 공유/북마크/새로고침 진입이 실제 경로)에서 "닫기"/"뒤로가기" 동작은 `router.back()`이 아니라 `router.push("/구체적경로")`로 구현한다.

**Why:** `router.back()`은 브라우저 히스토리에 의존한다. 딥링크·공유 링크·새로고침으로 그 라우트에 바로 진입한 경우 히스토리에 돌아갈 곳이 없어 닫기 버튼이 아무 동작도 안 하거나(특히 향후 웹뷰 앱화 시) 앱 밖으로 나가버릴 수 있다. `CameraView`(`router.push("/calendar")`), `SettingsView`(`router.push("/")`), `FeedDetailView`의 "기록을 찾을 수 없어요" 에러 분기(`router.push("/feed")`)가 모두 이 패턴이었는데, 2026-08-31 리뷰에서 `FeedDetailView`의 모달 오버레이 배경클릭/X버튼에만 `router.back()`이 새로 도입된 걸 발견하고 `router.push("/feed")`로 고쳤다(같은 파일 안에 이미 있던 패턴과도 불일치했음).

**How to apply:** 새 diff에서 `router.back()` 호출이 보이면, 그 화면이 실제 App Router 동적 라우트(`app/**/[param]/page.tsx`)로 직접 진입 가능한지 먼저 확인한다(`Glob "app/**/page.tsx"`로 확인). 직접 진입 가능하면 🔴로 플래그하고 `router.push("/명시적경로")`로 고치는 걸 제안(간단한 케이스면 자동 수정). `widgets/month-calendar/ui/EntryDetailModal.tsx`처럼 부모가 로컬 state로 여닫는 진짜 모달(라우트 아님, `onClose` 콜백)은 이 규칙 대상이 아니다 — 애초에 navigation을 안 쓴다.
