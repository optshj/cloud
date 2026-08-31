---
name: privacy-security
description: cloud(구름 수집 서비스) 프로젝트의 프라이버시/보안 체크리스트 — GPS 좌표, AI Gateway 키, Supabase service role, API 입력 검증. code-reviewer가 diff를 볼 때, 또는 위치/인증/외부 API 연동 코드를 작성할 때 사용.
---

# 프라이버시 / 보안

- **GPS 정확 좌표 노출** — 서버 내부(DB)에 원본 `lat`/`lng`를 저장하는 것 자체는 괜찮다(실제로 `cloud_entries` 테이블이 그렇게 한다). 문제는 **API 응답이나 클라이언트에 원본 좌표가 그대로 나가는 경우**다 — 응답에는 변환된 `location_dong`만 담아야 한다(`docs/PRODUCT.md` 결정). 신규 API 응답에 `lat`/`lng` 필드가 그대로 있으면 🔴.
- **AI Gateway 키(`x-api-key`) 클라이언트 노출** — `NEXT_PUBLIC_` 접두사가 붙었거나 클라이언트 컴포넌트에서 직접 호출하면 🔴. Anthropic SDK 호출은 항상 서버(Route Handler/서버 컴포넌트)에서만.
- **Supabase service role 키 노출** — 클라이언트 실행 경로에 들어가면 RLS를 우회할 수 있다.
- **입력 검증 없는 `app/api/**/route.ts` 진입점** — 사용자 입력을 검증 없이 그대로 쓰는지 확인.
