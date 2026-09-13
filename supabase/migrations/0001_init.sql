-- 초기 스키마. entry-photos 버킷(Public)은 대시보드에서 먼저 만든다.

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
  unique (user_id, entry_date) -- 하루 1장
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

-- 신고 3건 누적 시 자동 숨김
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

-- security_invoker 필수 — 빼면 뷰 소유자 권한으로 돌아 RLS를 우회한다.
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
