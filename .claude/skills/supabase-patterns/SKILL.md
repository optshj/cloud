---
name: supabase-patterns
description: cloud(구름 수집 서비스) 프로젝트에서 Supabase(Auth/Postgres/Storage) 연동 코드나 `app/api/**/route.ts`를 작성할 때 사용. 클라이언트 종류 선택, 인증 체크, 서버 권위값 재계산 같은 이 프로젝트의 실제 관례를 담는다.
---

# Supabase 연동 패턴 (cloud)

`src/shared/lib/supabase/`에 클라이언트 3종이 이미 있다 — 새로 만들지 말고 상황에 맞는 걸 고른다.

## 클라이언트 3종

| 파일 | 용도 | 주의 |
|---|---|---|
| `client.ts` (`createClient`, browser) | 클라이언트 컴포넌트에서 쓰는 anon key 클라이언트 | RLS가 항상 적용된다 |
| `server.ts` (`createClient`, async) | Route Handler·Server Component 전용 | **매 요청마다 새로 생성** — 공유/캐시하지 않는다. `await` 필요 |
| `admin.ts` (`createAdminClient`) | service role 키로 RLS 우회 | **Route Handler(`app/api/**`)에서만.** `'use client'` 컴포넌트에서 import하면 service role 키가 브라우저 번들에 노출된다(`privacy-security` 스킬 참고). 본인 권한을 넘어서는 작업(탈퇴 시 다른 유저 auth 계정 삭제 등)에만 쓴다 |

## Route Handler 작성 관례

1. **항상 먼저 인증 체크**: `const { data: { user } } = await supabase.auth.getUser()`, 없으면 401 + 한국어 에러 메시지(`{ error: "로그인이 필요해요" }`).
2. **바디는 수동으로 타입 캐스팅 후 필수값 검증** — zod 등 검증 라이브러리는 안 쓴다(설치돼 있지 않음). `typeof` 체크로 충분히 좁힌다.
3. **클라이언트 값을 신뢰하지 않고 서버가 권위값을 다시 계산한다** — 날짜(`seoulDateKey()`), 위치(`reverseGeocodeToDong(lat, lng)`)는 클라이언트가 보낸 값을 그대로 믿지 않고 서버에서 재계산/재검증한다.
4. **Postgres 에러 코드로 사용자 메시지를 분기** — 예: `error.code === "23505"`(unique violation) → "오늘은 이미 기록했어요" 같은 구체적 메시지. 뭉뚱그린 "실패했습니다"는 쓰지 않는다.
5. **응답에 정확한 GPS 좌표를 담지 않는다** — DB에는 `lat`/`lng`를 저장해도 되지만(서버 내부용), API 응답은 `location_dong`(변환된 동 단위)만 내려준다. `privacy-security` 스킬 참고.

## AI Gateway 연동

Anthropic SDK로 학교 API Gateway를 호출하는 AI 코멘트 생성 코드는 실패 시 조용히 더미 코멘트로 폴백한다 — 구름 여부를 검증하는 로직을 추가하지 않는다(`docs/PRODUCT.md`). 이 부분을 만지거나 새로 비슷한 걸 만들 때는 `claude-api` 스킬을 같이 참고한다.
