# 개발 컨벤션

이 프로젝트의 시행착오·결정을 쌓아두는 지식 저장소. 새 규칙이 생기면 코드가 아니라 여기 먼저 적는다.

## 원칙

- **아키텍처는 문서가 아니라 도구로 규약한다.** FSD 레이어 방향·딥임포트 금지는 `eslint.config.mjs`가 강제한다(`import/no-restricted-paths`, `import/no-internal-modules`) — 규칙을 바꾸려면 그 파일을 고친다.
- **오류 메시지는 구체적으로 작성한다.** "실패했습니다" 금지 — 무엇이 왜 실패했는지 원인이 드러나야 피드백 루프가 돈다.
- **죽은 코드는 주기적으로 정리한다.** `npm run check:unused`(ts-prune)로 확인한다. Next.js route export(`default`/`GET`/`POST`), 미들웨어 export(`src/proxy.ts`의 `proxy`/`config`), FSD `index.ts`의 public API export는 정상적인 false positive이니 그 외 항목만 본다.
- **결정과 시행착오는 이 폴더(`docs/`)에 폴더를 분류해 문서화한다.** 다음 세션·다른 agent가 같은 시행착오를 반복하지 않도록 하는 게 목적이다.

## 알려진 한계

열려 있는 한계 항목(`photo_path`의 user_id 노출, `cloud_entries` 직접 조회로 새는 원본 좌표)은
→ [`TODO.md`](TODO.md) §2-1·§2-5로 이관했다. 여기는 그 과정에서 얻은 **판단 규칙**만 남긴다.

**노출 여부는 뷰가 아니라 테이블 권한에서 확인한다.** (2026-09-02 정정)

이 자리엔 원래 "GPS 원본 좌표는 확실히 막혔다"고 적혀 있었다. `entry_feed` 뷰에서 컬럼을
뺀 것만 보고 판단한 결과였는데, `public` 스키마 테이블은 뷰와 무관하게 PostgREST로 자동
노출되므로 `cloud_entries`를 직접 치면 그대로 응답한다. **뷰를 좁히는 것은 노출을 막는
수단이 아니다** — 다음에 같은 판단을 할 땐 테이블 자체를 anon 키로 한 번 쳐본다.
