-- 원본 좌표(lat/lng)를 DB엔 계속 담되, 클라이언트 키로는 읽을 수 없게 컬럼 권한으로 막는다.
-- 적용 방법은 0001과 동일 — SQL Editor에 붙여넣고 실행하거나 `supabase db push`.
--
-- 왜 필요한가: 0002가 entry_feed 뷰에서 lat/lng를 뺐지만 그건 **뷰 경유 노출만** 막은 것이다.
-- public 스키마 테이블은 뷰와 무관하게 PostgREST가 자동 노출하고 anon 키는 NEXT_PUBLIC_이라
-- 공개값이라서, 지금도 아래 요청이 그대로 응답한다:
--
--   GET /rest/v1/cloud_entries?select=lat,lng
--
-- 확인 시점엔 저장된 좌표가 전부 null이라 새는 값이 없었을 뿐, POST /api/entries/confirm이
-- 클라이언트가 보낸 좌표를 반올림 없이 그대로 insert하므로 **행이 하나만 쌓여도** "정확한 좌표를
-- 노출하지 않는다"는 제품 결정(docs/PRODUCT.md "확정된 제품 스펙")이 깨진다.
--
-- 왜 select 정책을 좁히지 않는가: cloud_entries_select를 auth.uid() = user_id로 좁히면
-- entry_feed가 security_invoker = true라 뷰도 같이 좁아져 **피드가 죽는다**(로그인 유저는 자기 글만,
-- 비로그인은 0행). 행이 아니라 컬럼을 막아야 하는 이유가 이것이다.
--
-- 왜 `revoke select (lat, lng)` 한 줄이 아닌가: Postgres에서 **테이블 단위 select 권한을 들고 있으면
-- 컬럼 단위 revoke는 효과가 없다.** 테이블 권한이 모든 컬럼을 덮기 때문이다. 그래서 테이블 권한을
-- 먼저 회수하고, 실제로 읽어야 하는 컬럼만 다시 부여한다.

revoke select on public.cloud_entries from anon, authenticated;

-- lat/lng를 뺀 나머지 전부. 앱이 이 테이블을 직접 읽는 경로는 두 곳뿐이고 둘 다 여기 포함된다:
--   - fetchMyTodayEntry: select("comment") + user_id/entry_date 필터
--     (Postgres는 **필터에 쓰는 컬럼에도 select 권한을 요구한다** — user_id를 빼면 이게 깨진다)
--   - POST /api/entries/confirm: insert 후 .select("id, entry_date, location_dong, tag, comment, photo_path")
--     (insert 권한은 별개라 좌표 저장은 계속 된다. returning 목록에 lat/lng가 없어서 통과한다)
--
-- user_id는 여기 남는다 — entry_feed가 security_invoker라 is_mine(e.user_id = auth.uid())을
-- 계산하려면 조회자에게 이 컬럼 권한이 필요하다. user_id 노출 자체는 별개 건이다(docs/TODO.md §2-1).
grant select (
  id,
  user_id,
  entry_date,
  location_dong,
  tag,
  comment,
  photo_path,
  is_hidden,
  created_at
) on public.cloud_entries to anon, authenticated;

-- 적용 후 확인 (anon 키로):
--   GET /rest/v1/cloud_entries?select=lat        → 42501 permission denied for column lat
--   GET /rest/v1/cloud_entries?select=location_dong → 정상 응답 ("제주시 이도이동")
--   GET /rest/v1/entry_feed?select=is_mine       → 정상 응답 (뷰가 안 깨졌는지)
