-- lat/lng를 클라이언트 키로 못 읽게 한다(PostgREST가 테이블을 직접 노출한다).
-- select 정책을 좁히면 security_invoker 뷰(피드)도 좁아져서 컬럼 권한으로 막는다.
-- 테이블 select 권한이 있으면 컬럼 revoke가 안 먹어서, 테이블 권한을 회수하고 필요한 컬럼만 다시 준다.
revoke select on public.cloud_entries from anon, authenticated;

-- lat/lng 제외 전부. 필터·returning에 쓰는 컬럼도 select 권한이 필요하다.
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
