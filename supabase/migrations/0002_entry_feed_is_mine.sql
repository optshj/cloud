-- 내 기록/남의 기록 구분값을 뷰에 얹고, 뷰가 내보내는 컬럼을 앱이 실제로 읽는 것만으로 좁힌다.
-- 적용 방법은 0001과 동일 — SQL Editor에 붙여넣고 실행하거나 `supabase db push`.
--
-- 왜 user_id를 그냥 내려주지 않는가: 사진첩·피드는 전체공개라 user_id를 클라이언트로
-- 보내면 "이 사진들이 같은 사람 것"이라는 정보가 새로 생긴다(프로필 기능이 없어 지금은
-- 노출되지 않는 정보다). 비교는 DB에서 끝내고 boolean 하나만 내려보낸다.
--
-- 왜 e.*가 아닌가: 0001은 "앱 코드가 select 목록에서 lat/lng를 항상 제외한다"에 기댔지만
-- 그건 방어선이 아니다. entry_feed는 public 스키마 뷰라 PostgREST가 자동 노출하고,
-- anon 키는 NEXT_PUBLIC_이라 공개값이다 — 누구나 ?select=user_id,lat,lng로 원본 GPS와
-- 작성자 묶음을 그대로 긁어갈 수 있었다. 컬럼을 아예 뷰 밖에 두는 게 유일한 방어다.
--
-- 한계: photo_path가 `{user_id}/{date}.jpg`라 폴더명으로 user_id가 그대로 새어나간다.
-- 즉 위의 "boolean 하나만"은 user_id 컬럼에 한정된 얘기고, 그룹핑 자체는 아직 못 막았다.
-- GPS 좌표는 확실히 막혔고, 프로필 기능이 없어 v1에선 알려진 한계로 둔다 —
-- 배경과 고칠 때 함께 움직여야 할 네 군데는 docs/CONVENTIONS.md "알려진 한계" 참고.
--
-- create or replace view는 컬럼을 지울 수 없어서 drop 후 재생성한다.
--
-- 비로그인이면 auth.uid()가 null이라 is_mine도 null로 나온다 — 앱에서 false로 접는다.
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
