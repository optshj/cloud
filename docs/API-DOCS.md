# API 문서

> **관할: `api-developer`가 쓰고 관리한다.** API 스펙(Route Handler)이 바뀔 때마다 이 문서도 같이 갱신한다.
> `frontend-dev`는 이 문서를 **read-only**로만 참고한다 — 여기서 프론트 구현 세부사항을 다루지 않는다.

이 프로젝트는 zod 없이 수동 타입 캐스팅으로 입력을 검증한다(`docs/CONVENTIONS.md`). 아래 "요청 스키마"는 실제 코드의 캐스팅/검증 로직을 그대로 반영한 것이며, 스펙을 새로 정의한 게 아니다.

공통 인증 방식: `supabase.auth.getUser()`로 세션 쿠키를 확인한다. 모든 엔드포인트가 "내 계정"만 다루며 경로/바디에 `userId`를 받지 않는다(`supabase-patterns` 스킬).

---

## `DELETE /api/account`

계정 탈퇴 — 사진 파일과 auth 계정을 즉시 전체 삭제한다(유예기간 없음, `docs/PRODUCT.md` 필수 스펙).

| 항목 | 내용 |
|---|---|
| 인증 | 필요. 미인증 시 `401 { error: "로그인이 필요해요" }` |
| 요청 바디 | 없음 |
| 응답(성공) | `204 No Content` (본문 없음) |
| 응답(실패) | `500 { error: "탈퇴 처리에 실패했어요" }` — `admin.auth.admin.deleteUser` 실패 시 |

**동작:**
1. `createAdminClient()`(service role)로 `entry-photos` 버킷의 `{userId}/` 하위 파일 목록을 조회 후 전부 삭제.
2. `admin.auth.admin.deleteUser(user.id)`로 auth 계정 삭제.
3. `cloud_entries`/`entry_likes`/`entry_reports` 행은 별도 삭제 코드 없이 `auth.users` FK의 `on delete cascade`로 같이 삭제된다(DB 제약에 위임, 앱 코드가 아님).

파일 목록 조회가 비어있으면(`files`가 falsy/빈 배열) 삭제 호출 자체를 건너뛴다. Storage 삭제 실패는 별도 분기 없이 무시되고 auth 계정 삭제로 진행한다(에러를 던지지 않음).

---

## `POST /api/entries/preview`

오늘 하늘 사진 미리보기 — AI 코멘트와 위치를 생성만 하고 **DB에는 아무것도 저장하지 않는다**. "기록하기"를 눌러야 `/api/entries/confirm`에서 저장된다.

| 항목 | 내용 |
|---|---|
| 인증 | 필요. 미인증 시 `401 { error: "로그인이 필요해요" }` |
| 요청 바디 | `{ photoPath: string; lat: number; lng: number }` |

**요청 검증(수동 캐스팅):**
```ts
const { photoPath, lat, lng } = body as { photoPath?: string; lat?: number; lng?: number };
if (!photoPath || typeof lat !== "number" || typeof lng !== "number") → 400
```

**응답(성공, `200`):**
```ts
{ tag: string; comment: string; locationDong: string }
```

**응답(실패):**
| 상태 코드 | 조건 | 메시지 |
|---|---|---|
| 400 | `photoPath`/`lat`/`lng` 누락 또는 타입 불일치 | `"잘못된 요청이에요"` |
| 502 | `reverseGeocodeToDong` 실패(카카오 API 실패, 키 미설정 등) | `"위치 확인에 실패했어요"` |

**서버 재계산:** 클라이언트가 보낸 `lat`/`lng`는 신뢰하지 않고 서버가 `reverseGeocodeToDong(lat, lng)`로 동 단위 위치를 직접 계산한다. 응답에는 변환된 `locationDong`만 담고 원본 좌표는 응답에 포함하지 않는다(`privacy-security` 스킬).

**외부 연동:**
- 카카오 로컬 API(`coord2regioncode`)로 좌표 → 행정동 변환 (`reverseGeocodeToDong`, `src/shared/lib/kakao/reverse-geocode.ts`).
- 학교 AI Gateway(Anthropic SDK, `baseURL`을 gateway로 교체)로 사진에 대한 태그/코멘트 생성 (`generateAiComment`, `src/features/capture-cloud/lib/generate-ai-comment.ts`). `ANTHROPIC_API_KEY` 미설정이거나 호출/파싱 실패 시 **조용히** 더미 코멘트(`pickRandomComment`)로 폴백한다 — 구름 여부 검증 로직 없음(`docs/PRODUCT.md` 스코프).
- 위치 변환과 AI 코멘트 생성은 `Promise.all`로 병렬 호출된다.

Supabase Storage에서 `photoPath`의 public URL(`getPublicUrl`)을 만들어 AI Gateway에 이미지로 전달한다(DB 쓰기는 없음).

---

## `POST /api/entries/confirm`

"기록하기" — 오늘의 하늘 사진을 실제로 저장한다(하루 1장 제한).

| 항목 | 내용 |
|---|---|
| 인증 | 필요. 미인증 시 `401 { error: "로그인이 필요해요" }` |
| 요청 바디 | `{ photoPath: string; lat: number; lng: number; tag: string; comment: string }` |

**요청 검증(수동 캐스팅):**
```ts
const { photoPath, lat, lng, tag, comment } = body as {
  photoPath?: string; lat?: number; lng?: number; tag?: string; comment?: string;
};
if (!photoPath || typeof lat !== "number" || typeof lng !== "number" || !tag || !comment) → 400
```

**응답(성공, `200`):**
```ts
{
  id: string;
  date: string;        // entry_date (서버 재계산값)
  location: string;    // location_dong (서버 재계산값, 원본 좌표 아님)
  tag: string;
  comment: string;
  likes: 0;             // 방금 생성된 행이라 항상 0
  liked: false;          // 방금 생성된 행이라 항상 false
  photoDataUrl: string;  // Storage public URL
}
```

**응답(실패):**
| 상태 코드 | 조건 | 메시지 |
|---|---|---|
| 400 | 필드 누락/타입 불일치 | `"잘못된 요청이에요"` |
| 502 | `reverseGeocodeToDong` 실패 | `"위치 확인에 실패했어요"` |
| 409 | Postgres unique violation(`error.code === "23505"`, 하루 1장 제한 위반) | `"오늘은 이미 기록했어요"` |
| 500 | 그 외 insert 에러 | `"저장에 실패했어요"` |

**서버 재계산(클라이언트 값을 믿지 않는 지점):**
- **날짜**: 클라이언트가 날짜를 보내지 않는다 — 서버가 `seoulDateKey()`로 오늘 날짜(entry_date, 서울 기준)를 직접 계산해 unique 제약(하루 1장)의 기준으로 쓴다.
- **위치**: `lat`/`lng`를 그대로 저장하지 않고 `reverseGeocodeToDong(lat, lng)`로 `location_dong`을 재계산한다.

**Supabase:**
- `cloud_entries` 테이블에 `user_id, entry_date, location_dong, lat, lng, tag, comment, photo_path` insert. `lat`/`lng` 원본 좌표는 DB에는 저장되지만(내부용, `docs/ERD.md` 참고) **응답에는 포함하지 않는다** — `select("id, entry_date, location_dong, tag, comment, photo_path")`로 원본 좌표 컬럼을 애초에 select하지 않는다.
- `entry_date` unique 제약 위반 시 Postgres 에러 코드 `23505`로 하루 중복 저장을 막는다.
- 저장된 `photo_path`로 Storage public URL(`getPublicUrl`)을 만들어 `photoDataUrl`로 응답.

**외부 연동:** 카카오 로컬 API(`reverseGeocodeToDong`)만 호출한다. AI 코멘트는 이 엔드포인트에서 생성하지 않는다 — `tag`/`comment`는 `/api/entries/preview`에서 이미 생성된 값을 클라이언트가 그대로 전달받아 보낸 것을 서버가 검증 없이(타입만 확인) 저장한다.
