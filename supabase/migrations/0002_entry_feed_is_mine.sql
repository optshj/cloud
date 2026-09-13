-- 뷰 컬럼을 앱이 읽는 것만으로 좁힌다 — e.*면 PostgREST로 lat/lng·user_id가 샌다. user_id 대신 is_mine만.
-- create or replace view는 컬럼을 못 지워서 drop 후 재생성한다.
drop view if exists entry_feed;

create view entry_feed
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
  (e.user_id = auth.uid()) as is_mine
from cloud_entries e;
