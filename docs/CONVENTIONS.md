# 개발 컨벤션

이 프로젝트의 시행착오·결정을 쌓아두는 지식 저장소. 새 규칙이 생기면 코드가 아니라 여기 먼저 적는다.

## 원칙

- **아키텍처는 문서가 아니라 도구로 규약한다.** FSD 레이어 방향·딥임포트 금지는 `eslint.config.mjs`가 강제한다(`import/no-restricted-paths`, `import/no-internal-modules`) — 규칙을 바꾸려면 그 파일을 고친다.
- **오류 메시지는 구체적으로 작성한다.** "실패했습니다" 금지 — 무엇이 왜 실패했는지 원인이 드러나야 피드백 루프가 돈다.
- **죽은 코드는 주기적으로 정리한다.** `npm run check:unused`(ts-prune)로 확인한다. Next.js route export(`default`/`GET`/`POST`), 미들웨어 export(`src/proxy.ts`의 `proxy`/`config`), FSD `index.ts`의 public API export는 정상적인 false positive이니 그 외 항목만 본다.
- **결정과 시행착오는 이 폴더(`docs/`)에 폴더를 분류해 문서화한다.** 다음 세션·다른 agent가 같은 시행착오를 반복하지 않도록 하는 게 목적이다.

## 알려진 한계

**`photo_path`가 user_id를 노출한다.** (2026-09-02 확인, 미해결)

`entry_feed` 뷰는 `user_id`/`lat`/`lng`를 아예 컬럼에서 뺐지만(`0002`), 남아 있는
`photo_path`가 `{user_id}/{entry_date}.jpg` 형태라 폴더명이 곧 user_id다. anon 키는
`NEXT_PUBLIC_`이라 공개값이므로 누구나 `GET /rest/v1/entry_feed?select=photo_path`로
"이 사진들이 같은 사람 것"이라는 그룹핑을 복원할 수 있다 — `0002`가 막으려던 정보 그 자체다.

그룹핑 쪽은 프로필 기능이 없어 user_id로 사람을 특정할 수단이 아직 없다. 그래서 v1에서는
알려진 한계로 두기로 했다.

**프로필·팔로우처럼 user_id에 사람을 붙이는 기능이 생기면 그때 반드시 같이 처리한다.**
고치려면 최소 네 군데(storage RLS + 아래 코드 3곳)가 함께 움직여야 해서 지금 하기엔 비용이 크다:

- `storage.objects` RLS 3종(insert/update/delete)이 `(storage.foldername(name))[1] = auth.uid()::text`로
  **폴더명이 user_id인 것에 쓰기 권한을 걸고 있다.** 경로를 바꾸면 소유권 판정을
  폴더명 대신 `cloud_entries` 조인으로 옮겨야 한다.
- `CameraView`의 업로드 경로, `deleteEntryRemote`의 경로 재구성(`{userId}/{entryDate}.jpg`),
  `DELETE /api/account`의 `storage.list(user.id)`가 전부 같은 컨벤션에 기대고 있다.
- 기존 파일 이관 + `photo_path` 백필이 필요하다.
- e2e도 같은 포맷을 하드코딩하고 있다(`e2e/smoke.spec.ts`의 `photo_path` 픽스처, 그리고
  로컬 QA 시드 스크립트) — 경로를 바꾸면 같이 깨진다.

덧붙여 이 포맷은 **규약이지 제약이 아니다.** `POST /api/entries/confirm`은 클라이언트가 보낸
`photoPath` 문자열을 검증 없이 그대로 insert한다 — 포맷을 실제로 붙잡고 있는 건 `CameraView`의
업로드 경로와 storage insert RLS(첫 세그먼트 = uid)뿐이다.

**노출 여부는 뷰가 아니라 테이블 권한에서 확인한다.** (2026-09-02 정정)

이 자리엔 원래 "GPS 원본 좌표는 확실히 막혔다"고 적혀 있었다. `entry_feed` 뷰에서 컬럼을
뺀 것만 보고 판단한 결과였는데, `public` 스키마 테이블은 뷰와 무관하게 PostgREST로 자동
노출되므로 `cloud_entries`를 직접 치면 그대로 응답한다. **뷰를 좁히는 것은 노출을 막는
수단이 아니다** — 다음에 같은 판단을 할 땐 테이블 자체를 anon 키로 한 번 쳐본다.

재현·영향 범위·고칠 방법은 → `ERD.md` "알려진 한계"로 이관(착수 조건은 `BACKLOG.md` §2-5).
