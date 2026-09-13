-- user_id 노출 차단: 경로를 `{uuid}.jpg`로 바꾸고 user_id 컬럼 권한을 회수한다(하나만 막으면 다른 쪽으로 샌다).
-- 코드 변경과 같이 배포해야 한다 — 한쪽만 적용하면 업로드가 막힌다.

-- 1) 뷰가 security_invoker라 user_id 권한을 회수하면 뷰가 깨진다 — 비교만 security definer 함수로 내린다.
create or replace function public.entry_is_mine(entry uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id = auth.uid() from cloud_entries e where e.id = entry;
$$;

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

-- 2) 0003이 테이블 권한을 회수해둬서 컬럼 revoke가 먹는다. RLS 정책은 컬럼 권한과 무관하다.
revoke select (user_id) on public.cloud_entries from anon, authenticated;

-- 3) storage 소유권: 폴더명 → owner_id. insert는 이름이 uuid라 소유권을 따지지 않는다.
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

-- 4) 탈퇴 시 업로더 기준 파일 목록. storage 스키마는 PostgREST에 노출되지 않아 함수로 연다.
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

-- service role만 — Supabase는 새 함수에 anon/authenticated execute를 기본으로 준다.
revoke execute on function public.entry_photo_paths(uuid) from public, anon, authenticated;
grant execute on function public.entry_photo_paths(uuid) to service_role;
