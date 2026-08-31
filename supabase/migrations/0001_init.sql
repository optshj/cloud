-- 구름 앱 초기 스키마.
-- 적용 방법: Supabase 대시보드 > SQL Editor에 이 파일 내용을 붙여넣고 실행하거나,
-- Supabase CLI가 있으면 `supabase db push`로 적용.
-- Storage 버킷(entry-photos)은 SQL로 만들 수 없는 부분이 있어 아래 "Storage 설정" 섹션에
-- 대시보드에서 해야 할 단계를 별도로 적어둔다.

create table if not exists cloud_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  location_dong text not null,
  lat double precision,
  lng double precision,
  tag text not null,
  comment text not null,
  photo_path text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date) -- 하루 1장 제한을 DB 레벨에서 강제
);

create table if not exists entry_likes (
  entry_id uuid not null references cloud_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create table if not exists entry_reports (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references cloud_entries (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entry_id, reporter_id)
);

-- 신고 3건 누적 시 자동 숨김 (CLAUDE.md: 신고 버튼 + 누적 시 자동 숨김, 생략 금지)
create or replace function hide_entry_after_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from entry_reports where entry_id = new.entry_id) >= 3 then
    update cloud_entries set is_hidden = true where id = new.entry_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hide_entry_after_reports on entry_reports;
create trigger trg_hide_entry_after_reports
  after insert on entry_reports
  for each row execute function hide_entry_after_reports();

-- 좋아요 수를 얹은 공개 조회용 뷰. lat/lng도 컬럼엔 포함되지만, 앱 코드가 select 목록에서
-- 항상 제외하므로(entities/cloud-entry/model/api.ts) 클라이언트로는 내려가지 않는다.
-- security_invoker = true 필수: Postgres 뷰는 기본적으로(false) 뷰 소유자(postgres, RLS 우회 가능) 권한으로
-- 실행되어 cloud_entries의 RLS를 그대로 뚫어버린다 — 이 옵션을 빼면 숨김/타인 글까지 다 노출된다.
create or replace view entry_feed
  with (security_invoker = true)
as
select
  e.*,
  (select count(*) from entry_likes l where l.entry_id = e.id) as likes_count
from cloud_entries e;

alter table cloud_entries enable row level security;
alter table entry_likes enable row level security;
alter table entry_reports enable row level security;

drop policy if exists "cloud_entries_select" on cloud_entries;
create policy "cloud_entries_select" on cloud_entries
  for select using (not is_hidden or auth.uid() = user_id);

drop policy if exists "cloud_entries_insert" on cloud_entries;
create policy "cloud_entries_insert" on cloud_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "cloud_entries_delete" on cloud_entries;
create policy "cloud_entries_delete" on cloud_entries
  for delete using (auth.uid() = user_id);

drop policy if exists "entry_likes_select" on entry_likes;
create policy "entry_likes_select" on entry_likes for select using (true);

drop policy if exists "entry_likes_insert" on entry_likes;
create policy "entry_likes_insert" on entry_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "entry_likes_delete" on entry_likes;
create policy "entry_likes_delete" on entry_likes
  for delete using (auth.uid() = user_id);

drop policy if exists "entry_reports_insert" on entry_reports;
create policy "entry_reports_insert" on entry_reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "entry_reports_select" on entry_reports;
create policy "entry_reports_select" on entry_reports
  for select using (auth.uid() = reporter_id);

-- entry_feed 뷰는 security_invoker = true라서 cloud_entries의 RLS를 그대로 통과시키므로 별도 정책 불필요.

-- ============================================================
-- Storage 설정 (SQL Editor가 아니라 대시보드에서 수동으로 해야 함)
-- ============================================================
-- 1. Storage > New bucket > 이름 "entry-photos", Public bucket 체크.
-- 2. 아래 정책은 SQL Editor에서 실행 가능 (storage.objects는 이미 RLS가 켜져 있음):

drop policy if exists "entry_photos_insert" on storage.objects;
create policy "entry_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'entry-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_update" on storage.objects;
create policy "entry_photos_update" on storage.objects
  for update using (
    bucket_id = 'entry-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_delete" on storage.objects;
create policy "entry_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'entry-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_select" on storage.objects;
create policy "entry_photos_select" on storage.objects
  for select using (bucket_id = 'entry-photos');
