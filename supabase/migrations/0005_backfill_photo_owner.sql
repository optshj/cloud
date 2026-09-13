-- 데이터 보정(멱등): service role로 올린 파일은 owner_id가 비어 0004의 delete 정책에 조용히 막힌다.
-- 파일을 가리키는 기록의 주인으로 채운다.
update storage.objects o
set owner = e.user_id, owner_id = e.user_id::text
from public.cloud_entries e
where o.bucket_id = 'entry-photos'
  and o.owner_id is null
  and e.photo_path = o.name;
