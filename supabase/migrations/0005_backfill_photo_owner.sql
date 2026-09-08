-- owner_id가 빈 사진 파일에 업로더를 채운다. 스키마 변경이 아니라 **데이터 보정**이다 —
-- 0004가 소유권 판정을 경로에서 owner_id로 옮기면서 드러난 구멍을 메운다.
-- 적용 방법은 0001과 동일 — SQL Editor에 붙여넣고 실행하거나 `supabase db push`.
--
-- 왜 비어 있나: 0004 이전에 service role로 올라간 시드 3장이다. storage-api는 업로더의 JWT로
-- 올릴 때만 owner_id를 채운다 — service role로 올리거나 copy/move하면 비운다(2026-09-08 확인:
-- service role로 만든 복사본이 entry_photo_paths에 안 잡혔다).
--
-- 무엇이 깨지나: 0004의 delete 정책이 `owner_id = auth.uid()::text`라, 사용자가 기록을 지울 때
-- deleteEntryRemote의 storage 삭제가 정책에 막혀 **에러 없이 no-op**이 된다 — 행은 사라지고
-- 파일만 남는다. (탈퇴 경로는 DELETE /api/account가 업로더 목록에 내 기록의 photo_path를 합쳐
-- 지우므로 이미 덮여 있다.)
--
-- uid를 하드코딩하지 않는 이유: 그 값이 0004가 걷어낸 바로 그 정보라 파일에 적지 않는다.
-- 파일을 가리키는 기록의 주인이 곧 업로더이므로 조인으로 얻는다. 어느 기록도 가리키지 않는
-- ownerless 파일은 주인을 알 길이 없어 그대로 둔다(지금은 없다 — 하나 있던 건 삭제했다).
-- 이미 채워진 행은 건드리지 않으니 여러 번 돌려도 안전하고, 새 DB에선 0행이다.

update storage.objects o
set owner = e.user_id, owner_id = e.user_id::text
from public.cloud_entries e
where o.bucket_id = 'entry-photos'
  and o.owner_id is null
  and e.photo_path = o.name;

-- 적용 후 확인 (service_role 키로):
--   POST /rest/v1/rpc/entry_photo_paths {"target":"<그 계정 uid>"}  → 사진 3개가 나온다
--   (적용 전엔 빈 배열이었다)
