-- photo_path에서 user_id를 걷어낸다 — TODO.md §2-1이 "같이 움직여야 한다"고 적어둔 지점들을 한 번에.
-- 적용 방법은 0001과 동일 — SQL Editor에 붙여넣고 실행하거나 `supabase db push`.
-- **코드 변경과 같은 커밋에 묶여 있다.** 이 SQL만 먼저 적용하면 예전 경로(`{uid}/{date}.jpg`)로
-- 올리던 클라이언트의 업로드가 막히고, 코드만 먼저 배포하면 새 경로의 쓰기가 막힌다.
--
-- 무엇이 문제였나: 0002가 뷰에서 user_id를 뺀 건 "이 사진들이 같은 사람 것"이라는 그룹핑을 막으려던
-- 것인데, anon 키가 NEXT_PUBLIC_(공개값)이라 아래 두 경로로 그대로 새고 있었다:
--
--   GET /rest/v1/cloud_entries?select=user_id,photo_path   ← 0003이 남긴 user_id 컬럼 권한
--   GET /rest/v1/entry_feed?select=photo_path              ← 경로가 `{user_id}/{entry_date}.jpg`
--
-- **둘 중 하나만 고치면 나머지 하나로 똑같이 샌다.** 그래서 한 파일에서 같이 막는다.
--
-- 새 경로 컨벤션: **`{uuid}.jpg`** — 폴더 없이 촬영마다 새로 만든다. user_id도, 날짜도 담지 않는다.

-- ============================================================
-- 1) is_mine 계산을 뷰 밖으로 — 그래야 user_id 컬럼 권한을 회수할 수 있다
-- ============================================================
-- entry_feed는 security_invoker = true라(RLS를 그대로 통과시키려고, 이유는 ERD.md 참고)
-- 뷰 본문의 `e.user_id = auth.uid()`도 **조회자 권한**으로 평가된다 — 즉 user_id 컬럼 권한을
-- 회수하는 순간 뷰가 통째로 깨진다. 비교만 security definer 함수로 내리면 뷰는 invoker인 채로
-- 두면서 컬럼 권한은 뺄 수 있다. 함수가 돌려주는 건 "네 것이냐" boolean 하나라 새는 게 없다.
create or replace function public.entry_is_mine(entry uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id = auth.uid() from cloud_entries e where e.id = entry;
$$;

-- 비로그인이면 auth.uid()가 null이라 결과도 null — 예전 표현식과 동작이 같다(앱에서 false로 접는다).
grant execute on function public.entry_is_mine(uuid) to anon, authenticated;

create or replace view entry_feed
  with (security_invoker = true)
as
select
  e.id,
  e.entry_date,
  e.location_dong,
  e.tag,
  e.comment,
  e.photo_path,
  (select count(*) from entry_likes l where l.entry_id = e.id) as likes_count,
  public.entry_is_mine(e.id) as is_mine
from cloud_entries e;

-- ============================================================
-- 2) user_id 컬럼 select 권한 회수
-- ============================================================
-- 0003이 테이블 단위 권한을 이미 회수하고 컬럼만 부여해뒀으므로 여기선 컬럼 revoke가 먹는다.
-- RLS 정책(`auth.uid() = user_id`)은 컬럼 권한과 무관하게 계속 동작한다 — 정책 표현식은
-- 조회자의 컬럼 권한 검사 대상이 아니다.
-- 앱에서 이 컬럼을 필터로 쓰던 fetchMyTodayEntry는 entry_feed의 is_mine 필터로 옮겼다.
revoke select (user_id) on public.cloud_entries from anon, authenticated;

-- ============================================================
-- 3) storage 쓰기 소유권 판정: 폴더명 → owner_id
-- ============================================================
-- 경로가 더는 uid를 담지 않으니 `(storage.foldername(name))[1] = auth.uid()::text`가 성립하지 않는다.
-- storage-api가 업로드 시 owner_id를 업로더 uid로 채우므로 그걸 소유권으로 쓴다.
-- insert는 소유권을 따지지 않는다 — 새로 올리는 파일엔 "누구 것"이라 할 근거가 경로에도 DB에도 없다.
-- 이름이 uuid라 남의 파일을 겨냥할 수 없고, 덮어쓰기는 update 정책이 따로 막는다. 남는 건 로그인
-- 사용자의 스토리지 스팸인데 그건 전에도 열려 있었다(`{내 uid}/아무이름.jpg`에 개수 제한이 없었다).
drop policy if exists "entry_photos_insert" on storage.objects;
create policy "entry_photos_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'entry-photos');

drop policy if exists "entry_photos_update" on storage.objects;
create policy "entry_photos_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'entry-photos' and owner_id = auth.uid()::text
  );

drop policy if exists "entry_photos_delete" on storage.objects;
create policy "entry_photos_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'entry-photos' and owner_id = auth.uid()::text
  );

-- select 정책(`bucket_id = 'entry-photos'`, 누구나 읽기)은 0001 그대로 둔다 — 이제 파일명이
-- 불투명해서 목록을 긁어도 나오는 게 없다.

-- ============================================================
-- 4) 탈퇴 시 파일 삭제: 폴더 목록 → 업로더(owner_id) 조회
-- ============================================================
-- DELETE /api/account가 `storage.list(user.id)`로 폴더를 훑던 걸 대체한다. cloud_entries의
-- photo_path만 훑으면 **기록까지 안 가고 버려진 사진**(미리보기 후 이탈)이 남아서 "탈퇴 시 즉시
-- 전체 삭제"(→ PRODUCT.md "확정된 제품 스펙")가 그만큼 약해진다. 업로더 기준으로 전부 지운다.
-- 함수로 여는 이유: storage 스키마는 PostgREST에 노출돼 있지 않아 service_role 키로도 직접 못 읽는다.
create or replace function public.entry_photo_paths(target uuid)
returns setof text
language sql
stable
security definer
set search_path = storage, public
as $$
  select name from storage.objects
  where bucket_id = 'entry-photos' and owner_id = target::text;
$$;

-- 남의 uid를 넣어 파일 목록을 얻는 걸 막는다 — 서버(service role)만 호출한다.
-- Supabase는 public 스키마 새 함수에 anon/authenticated execute를 기본으로 주므로 명시적으로 뺀다.
revoke execute on function public.entry_photo_paths(uuid) from public, anon, authenticated;
grant execute on function public.entry_photo_paths(uuid) to service_role;

-- 적용 후 확인 (anon 키로):
--   GET /rest/v1/cloud_entries?select=user_id  → 42501 permission denied for table cloud_entries
--   GET /rest/v1/entry_feed?select=photo_path  → 정상 응답, 값이 `{uuid}.jpg` (기존 행은 백필 전까지 옛 경로)
--   GET /rest/v1/entry_feed?select=is_mine     → 정상 응답 (뷰가 안 깨졌는지)
--   POST /rest/v1/rpc/entry_photo_paths        → 42501 permission denied for function entry_photo_paths
--
-- 기존 파일 이관: 옛 경로(`{uid}/{date}.jpg`) 파일은 그대로 두면 계속 열린다(경로가 photo_path에
-- 남아 있고 select 정책도 그대로다). 새로 찍는 것부터 새 경로를 쓴다. 옛 행이 남아 있는 동안엔
-- 그 행들만 여전히 폴더명으로 user_id를 노출하므로, 운영 데이터가 있으면 파일 복사 + photo_path
-- 백필 후 옛 파일을 지운다.
