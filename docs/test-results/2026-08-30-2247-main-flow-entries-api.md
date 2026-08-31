## 대상

핵심 루프(촬영 → AI 코멘트 → 캘린더 저장) 중 실제로 자동화 가능한 서버 로직 — 카메라 하드웨어·Supabase 실 로그인이 필요한 부분은 제외.

- `app/api/entries/preview/route.test.ts`
- `app/api/entries/confirm/route.test.ts`

## 커맨드

```
npm run test
```

## 결과

전부 통과 (기존 `src/shared/lib/date.test.ts` 포함 총 19개 테스트).

- **preview** (6케이스): 401 미로그인 / 400 photoPath·lat·lng 각각 누락 / 502 위치 확인 실패(AI 코멘트 성공 여부와 무관) / 200 응답 shape + DB 미저장 계약(`supabase.from` 미호출) 확인.
- **confirm** (10케이스): 401 / 400 photoPath·lat·tag·comment 각각 누락 / 502 위치 확인 실패(insert 미시도까지 확인) / **서버 재계산 검증** — 클라이언트 바디엔 `entryDate` 필드가 아예 없는데 `seoulDateKey()`가 인자 없이 호출되고 그 반환값이 insert에 그대로 들어가는지 / **409 — unique violation(`error.code === "23505"`), "하루 1장" 스펙 가드레일** / 500 그 외 insert 에러 / 200 응답에 lat·lng 미노출(프라이버시 계약) 확인.

`npx tsc --noEmit` 클린. (`npx eslint`는 이 작업과 무관하게 `eslint-plugin-storybook` 모듈 누락으로 실행 자체가 안 되는 상태 — 별개의 기존 환경 문제.)

## 범위 제외

- 카메라 촬영 UI(브라우저 `getUserMedia` 등 하드웨어 의존)와 실제 카카오 로그인이 필요한 전체 촬영→기록 플로우. `e2e/smoke.spec.ts` 상단 주석과 같은 이유로 자동화 밖에 뒀다.
- API 경로 검증/에러 분기만 다뤘고, 그 앞뒤 UI(카메라 프리뷰 화면, 기록 완료 후 캘린더 반영 화면)는 다루지 않았다.

## 다음에 볼 것

이후 신규 테스트는 `.claude/agents/test-writer.md`의 "e2e 기본" 절차를 따른다. 로그인 없이 갈 수 있는 범위(탭 이동 등)는 이미 `e2e/smoke.spec.ts`가 커버 중이니, 로그인 세션 주입 방식이 정해지면 촬영→기록 플로우 자체를 e2e로 확장하는 게 다음 후보.
