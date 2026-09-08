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
| 응답(실패) | `500 { error: "사진 목록을 불러오지 못해 탈퇴를 중단했어요. 잠시 후 다시 시도해주세요" }` — 사진 경로 조회(RPC) 실패 시 / `500 { error: "탈퇴 처리에 실패했어요" }` — `admin.auth.admin.deleteUser` 실패 시 |

**동작:**
1. `createAdminClient()`(service role)로 `entry_photo_paths(target)` RPC를 호출해 그 유저가 올린 `entry-photos` 파일 경로를 전부 받아 삭제. 경로에 uid가 없어 폴더 목록으로는 찾을 수 없고, 업로더(`owner_id`) 기준이라 기록까지 안 간 사진도 같이 지워진다(→ `docs/ERD.md` "Storage").
2. `admin.auth.admin.deleteUser(user.id)`로 auth 계정 삭제.
3. `cloud_entries`/`entry_likes`/`entry_reports` 행은 별도 삭제 코드 없이 `auth.users` FK의 `on delete cascade`로 같이 삭제된다(DB 제약에 위임, 앱 코드가 아님).

파일 목록이 비어있으면 삭제 호출 자체를 건너뛴다. **목록 조회가 실패하면 탈퇴를 중단한다**(`500 { error: "사진 목록을 불러오지 못해 탈퇴를 중단했어요..." }`) — 사진을 남긴 채 계정만 지우면 되돌릴 수 없다. 반면 `remove` 자체의 실패는 별도 분기 없이 무시되고 auth 계정 삭제로 진행한다.

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
const body = await request.json().catch(() => null);
if (!body) → 400 ("요청 본문(JSON)을 읽지 못했어요")
if (!photoPath || !isValidLat(lat) || !isValidLng(lng)) → 400
```

**응답(성공, `200`):**
```ts
{ tag: string; comment: string; locationDong: string }
```

**응답(실패):**
| 상태 코드 | 조건 | 메시지 |
|---|---|---|
| 400 | 바디가 JSON이 아님 | `"요청 본문(JSON)을 읽지 못했어요"` |
| 400 | `photoPath` 누락, 또는 좌표가 숫자·유한·범위(±90/±180) 조건을 못 넘김 | `"잘못된 요청이에요"` |
| 502 | `reverseGeocodeToDong` 실패(Nominatim 응답 실패, 동·상위 지역명 둘 다 없음) | `"위치 확인에 실패했어요"` |

**서버 재계산:** 클라이언트가 보낸 `lat`/`lng`는 신뢰하지 않고 서버가 `reverseGeocodeToDong(lat, lng)`로 동 단위 위치를 직접 계산한다. 응답에는 변환된 `locationDong`만 담고 원본 좌표는 응답에 포함하지 않는다(`privacy-security` 스킬).

**외부 연동:**
- OSM Nominatim(`/reverse`)으로 좌표 → 동 단위 변환 (`reverseGeocodeToDong`, `src/shared/lib/geo/reverse-geocode.ts`). 키가 없어 발급·활성화 절차가 없는 대신 **정책상 초당 1건, 연락처가 담긴 User-Agent 필수**다. 행정동(`suburb`) 우선, 없으면 법정동(`quarter`)으로 접고, 동이 안 잡히면 상위 단위(구/시)만 돌려준다.
- 학교 AI Gateway(Anthropic SDK, `baseURL`을 gateway로 교체)로 사진에 대한 태그/코멘트 생성 (`generateAiComment`, `src/shared/lib/ai/generate-ai-comment.ts` — 서버 전용이라 features 배럴에서 뺐다. 클라이언트 컴포넌트가 같은 배럴을 import하면서 Anthropic SDK가 클라이언트 모듈 그래프에 들어가고 있었다. 게이트웨이 타임아웃 15초·재시도 1회). `ANTHROPIC_API_KEY` 미설정이거나 호출/파싱 실패 시 **조용히** 더미 코멘트(`pickRandomComment`)로 폴백한다 — 구름 여부 검증 로직 없음(`docs/PRODUCT.md` 스코프).
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
const body = await request.json().catch(() => null);
if (!body) → 400 ("요청 본문(JSON)을 읽지 못했어요")
if (!photoPath || !isValidLat(lat) || !isValidLng(lng) || !tag || !comment) → 400
if (tag.length > 20 || comment.length > 100) → 400
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
| 400 | 바디가 JSON이 아님 | `"요청 본문(JSON)을 읽지 못했어요"` |
| 400 | 필드 누락, 또는 좌표가 숫자·유한·범위 조건을 못 넘김 | `"잘못된 요청이에요"` |
| 400 | `tag` 20자 / `comment` 100자 초과 | `"태그는 20자, 코멘트는 100자를 넘을 수 없어요"` |
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

**외부 연동:** OSM Nominatim(`reverseGeocodeToDong`)만 호출한다. AI 코멘트는 이 엔드포인트에서 생성하지 않는다 — `tag`/`comment`는 `/api/entries/preview`에서 이미 생성된 값을 클라이언트가 그대로 전달받아 보낸 것이다. 서버는 **길이 상한만** 본다(태그 20자·코멘트 100자) — 공개 피드에 실리는 텍스트라 무제한 길이는 막지만, preview 결과와 같은 문구인지까지는 대조하지 않는다(→ [`TODO.md`](TODO.md) §2-11).
