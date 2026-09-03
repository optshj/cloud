# ERD — Supabase 스키마 현황

지금 Supabase에 **실제로 올라가 있는** 스키마. 진실 소스는 `supabase/migrations/0001_init.sql` + `0002_entry_feed_is_mine.sql`이고 둘 다 적용 완료다 — 이 문서는 그 최종 상태를 그린 것이지 계획이 아니다. 스키마를 바꾸면 마이그레이션을 추가하고 이 문서를 같이 고친다.

`0002`가 `entry_feed` 뷰를 `drop` 후 재생성했으므로 `0001`의 뷰 정의(`e.*` + `likes_count`)는 더 이상 존재하지 않는다.

## 테이블

```mermaid
erDiagram
    auth_users ||--o{ cloud_entries : "작성 (on delete cascade)"
    auth_users ||--o{ entry_likes : "좋아요 (on delete cascade)"
    auth_users ||--o{ entry_reports : "신고 (on delete cascade)"
    cloud_entries ||--o{ entry_likes : "받음 (on delete cascade)"
    cloud_entries ||--o{ entry_reports : "받음 (on delete cascade)"

    auth_users {
        uuid id PK "Supabase Auth가 관리 — 우리가 만들지 않는다"
    }

    cloud_entries {
        uuid id PK "default gen_random_uuid()"
        uuid user_id FK "not null, auth.users(id)"
        date entry_date "not null, user_id와 묶여 unique"
        text location_dong "not null, 동 단위로 변환된 위치"
        float8 lat "nullable, 서버 내부용"
        float8 lng "nullable, 서버 내부용"
        text tag "not null"
        text comment "not null, AI 코멘트"
        text photo_path "not null, 경로 컨벤션은 아래 Storage 절 참고"
        bool is_hidden "not null default false"
        timestamptz created_at "not null default now()"
    }

    entry_likes {
        uuid entry_id PK "FK cloud_entries(id)"
        uuid user_id PK "FK auth.users(id)"
        timestamptz created_at "not null default now()"
    }

    entry_reports {
        uuid id PK "default gen_random_uuid()"
        uuid entry_id FK "not null, reporter_id와 묶여 unique"
        uuid reporter_id FK "not null, auth.users(id)"
        timestamptz created_at "not null default now()"
    }
```

`auth_users`는 Mermaid가 점을 못 받아서 쓴 표기이고 실제 이름은 **`auth.users`** — Supabase Auth가 관리하는 테이블이라 우리 마이그레이션이 만들지 않고 FK로 참조만 한다.

**모든 FK가 `on delete cascade`다.** 탈퇴(= `auth.users` 행 삭제) 한 번으로 그 사람의 기록·좋아요·신고가 전부 따라 지워진다 — 제품 스펙의 "탈퇴 시 즉시 전체 삭제"(→ `PRODUCT.md` "확정된 제품 스펙")가 앱 코드의 성실함이 아니라 DB 제약으로 보장된다. 다만 Storage 파일은 cascade 대상이 아니라 `DELETE /api/account`가 따로 지운다.

`entry_likes`는 대리키 없이 `(entry_id, user_id)`가 곧 PK다 — 같은 사람이 같은 글에 두 번 좋아요를 누를 수 없다는 뜻.

## 하루 1장은 DB가 강제한다

```sql
unique (user_id, entry_date)
```

**앱 코드의 "오늘 이미 찍었나?" 체크가 아니라 이 제약이 실제 집행 지점이다.** 즉석 촬영 하루 1장은 서비스 정체성이라(→ `PRODUCT.md` "확정된 제품 스펙") 클라이언트 검사만으로 두면 동시 요청·조작된 요청으로 뚫린다. 여기가 막혀 있으므로 두 번째 저장은 Postgres unique violation(`23505`)으로 떨어지고, Route Handler는 그 코드를 잡아 "오늘은 이미 기록했어요"로 바꿔준다.

날짜 값 자체는 클라이언트를 믿지 않고 서버가 KST 기준으로 다시 계산한다(→ `.claude/skills/supabase-patterns/SKILL.md` "Route Handler 작성 관례").

## `entry_feed` — 테이블이 아니라 뷰

`cloud_entries`를 감싼 **뷰**다. 행을 저장하지 않고, 쓰기도 하지 않는다. **피드·사진첩의 목록 조회는 이 뷰만 읽는다** — 단건 확인(`fetchMyTodayEntry`)과 삭제는 `cloud_entries`를 직접 친다.

내보내는 컬럼은 정확히 8개:

| 컬럼 | 출처 |
| --- | --- |
| `id`, `entry_date`, `location_dong`, `tag`, `comment`, `photo_path` | `cloud_entries`에서 그대로 |
| `likes_count` | **계산** — `entry_likes`의 해당 `entry_id` 개수 서브쿼리 |
| `is_mine` | **계산** — `e.user_id = auth.uid()` |

**`user_id` / `lat` / `lng` / `is_hidden` / `created_at`은 뷰에 없다.** 특히 앞의 셋은 의도적으로 뺀 것이다 — 이유는 `0002_entry_feed_is_mine.sql` 상단 주석에 적혀 있다.

`is_mine`은 비로그인일 때 `auth.uid()`가 `null`이라 **`null`로 내려온다**(실제 anon 조회로 확인). 앱에서 `false`로 접는다.

### `security_invoker = true`가 왜 필수인가

Postgres 뷰는 기본값(`security_invoker = false`)에서 **뷰 소유자 권한**으로 실행된다. 소유자는 `postgres`고 RLS를 우회할 수 있으므로, 이 옵션을 빼는 순간 `cloud_entries`의 RLS가 통째로 무력화된다 — 숨김 처리된 글, 남의 글이 전부 뷰를 통해 그대로 나간다. `true`로 두면 조회한 사용자 권한으로 실행되어 아래 RLS 정책이 그대로 적용되고, 그래서 뷰에는 별도 정책이 필요 없다.

## RLS 정책

세 테이블 모두 `enable row level security`. 정책에 없는 동작은 전부 막힌다.

| 테이블 | 동작 | 조건 |
| --- | --- | --- |
| `cloud_entries` | select | `not is_hidden or auth.uid() = user_id` |
| | insert | `auth.uid() = user_id` |
| | delete | `auth.uid() = user_id` |
| | update | **정책 없음 → 클라이언트는 수정 불가** |
| `entry_likes` | select | `true` (좋아요 수는 공개값) |
| | insert / delete | `auth.uid() = user_id` |
| `entry_reports` | insert | `auth.uid() = reporter_id` |
| | select | `auth.uid() = reporter_id` (내 신고만 보인다) |
| | delete | **정책 없음 → 신고 취소 불가** |

**`cloud_entries_select`의 `not is_hidden or auth.uid() = user_id`가 숨김 처리의 실제 집행 지점이다.** 피드 쿼리에 `is_hidden` 필터를 안 걸어도 숨겨진 글은 DB에서 이미 잘려 나간다. 뒤의 `or`절 덕분에 본인은 자기 글이 숨겨져도 사진첩에서 계속 볼 수 있다.

`update` 정책이 없다는 게 짝을 이룬다 — `is_hidden`을 클라이언트가 되돌릴 수 없다. 유일하게 그 값을 바꾸는 건 아래 트리거다.

## 컬럼 권한 — RLS가 못 막는 층

RLS는 **행**을 막고, 여기 권한은 **컬럼**을 막는다. 둘은 서로를 대신하지 못한다.

`0003`이 `anon`/`authenticated`의 테이블 단위 select를 회수하고 `lat`/`lng`를 뺀 9개 컬럼만 다시 부여했다.

```sql
revoke select on public.cloud_entries from anon, authenticated;
grant select (id, user_id, entry_date, location_dong, tag, comment, photo_path, is_hidden, created_at)
  on public.cloud_entries to anon, authenticated;
```

**`revoke select (lat, lng)` 한 줄로는 안 된다** — Postgres에서 테이블 단위 select 권한을 들고 있으면 그게 모든 컬럼을 덮어서 컬럼 단위 revoke가 효과가 없다. 테이블 권한을 먼저 회수하고 필요한 컬럼만 다시 줘야 한다.

**`user_id`는 왜 남겨뒀나.** `entry_feed`가 `security_invoker = true`라 `is_mine`(`e.user_id = auth.uid()`)을 조회자 권한으로 계산한다 — 이 컬럼을 빼면 뷰가 통째로 깨진다. `fetchMyTodayEntry`도 `user_id`로 필터하는데 **Postgres는 필터에 쓰는 컬럼에도 select 권한을 요구한다.** `user_id` 노출은 별개 건이다(→ `TODO.md` §2-1).

좌표 **저장**은 계속 된다 — insert 권한은 select와 별개고, `POST /api/entries/confirm`의 `.select()` 반환 목록에 `lat`/`lng`가 없다.

## 신고 3건 → 자동 숨김

```
entry_reports에 insert
  → 트리거 trg_hide_entry_after_reports (after insert, for each row)
  → 함수 hide_entry_after_reports()
      해당 entry_id의 신고 수 >= 3 이면
      update cloud_entries set is_hidden = true
```

함수는 `security definer` + `set search_path = public`이다. **`definer`가 아니면 동작하지 않는다** — 신고자 권한으로 돌면 (1) `entry_reports` select 정책이 "내 신고만"이라 누적 개수를 셀 수 없고, (2) `cloud_entries`에 update 정책이 없어 숨김 처리를 못 한다.

숨김은 삭제가 아니다. 행은 남고 `is_hidden`만 `true`가 되며, 실제로 안 보이게 만드는 건 위의 select 정책이다.

신고 버튼 + 누적 시 자동 숨김은 전체공개 서비스의 최소 안전장치라 약화·누락시키지 않는다(→ `REVIEW-STANDARD.md` "스코프 가드레일").

## Storage

버킷 **`entry-photos`** (public). SQL로 만들 수 없어 대시보드에서 수동 생성했다 — 절차는 `0001_init.sql` 하단 "Storage 설정" 주석.

경로 컨벤션: **`{user_id}/{entry_date}.jpg`**

`storage.objects` 정책 4종:

| 동작 | 조건 |
| --- | --- |
| insert / update / delete | `bucket_id = 'entry-photos' and (storage.foldername(name))[1] = auth.uid()::text` |
| select | `bucket_id = 'entry-photos'` (누구나 읽기 — 피드가 전체공개라) |

**쓰기 3종이 폴더명으로 소유권을 판정한다.** 파일의 첫 경로 세그먼트가 자기 uid인 경우에만 쓰기가 허용된다 — `cloud_entries`와의 조인이 아니라 문자열 비교다. 그래서 경로 컨벤션이 단순한 작명 규칙이 아니라 **권한 모델의 일부**이고, 경로를 바꾸려면 정책도 같이 바꿔야 한다.

## 알려진 한계

원본 좌표는 `0003`의 컬럼 권한으로 막혔다(위 "컬럼 권한" 참고). 남은 건 **`user_id`가 두 경로로
새는 것** — `photo_path`의 폴더명, 그리고 `cloud_entries`의 `user_id` 컬럼 자체다. 둘 다 뿌리가
같고 배경·함께 움직여야 할 지점은 → [`TODO.md`](TODO.md) §2-1.
