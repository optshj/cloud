---
name: nextjs-app-router
description: cloud(구름 수집 서비스) 프로젝트의 Next.js App Router 규율 — "use client" 최소화, fetch 캐싱 의도, 서버 전용 모듈 경계. 라우트/서버 컴포넌트를 새로 만들거나 code-reviewer가 diff를 볼 때 사용.
---

# Next.js App Router

- **불필요한 `"use client"`** — 인터랙션이 없는데 지시어가 붙어 트리 상단을 오염시키지 않는지. 기본은 Server Component, 인터랙션이 실제로 필요한 leaf에만 붙인다.
- **fetch 캐싱 의도 누락** — `revalidate`/`tags`/`no-store` 중 하나는 명시적으로 결정돼 있어야 한다. 뮤테이션(좋아요, 신고, 업로드) 이후에는 관련 캐시 무효화가 짝을 이루는지 확인.
- **서버 전용 모듈 경계** — AI 코멘트 생성(Anthropic SDK 호출) 로직, Supabase service role 클라이언트 등은 클라이언트 번들에서 import 가능한 구조가 아닌지 확인한다.
