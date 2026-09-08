# 개발 컨벤션

이 프로젝트의 시행착오·결정을 쌓아두는 지식 저장소. 새 규칙이 생기면 코드가 아니라 여기 먼저 적는다.

## 원칙

- **아키텍처는 문서가 아니라 도구로 규약한다.** FSD 레이어 방향·딥임포트 금지는 `eslint.config.mjs`가 강제한다(`import/no-restricted-paths`, `import/no-internal-modules`) — 규칙을 바꾸려면 그 파일을 고친다.
- **오류 메시지는 구체적으로 작성한다.** "실패했습니다" 금지 — 무엇이 왜 실패했는지 원인이 드러나야 피드백 루프가 돈다.
- **`npm run lint`는 0건을 유지한다.** 2026-09-03에 레포 전체를 0건으로 정리했다(커밋 `3835e20`).
  CI가 없어서 이게 유일한 기계적 게이트다 — 실패하면 그 diff가 깨뜨린 것이니 넘기지 않는다.
  prettier 설정(`.prettierrc.yaml`)이 실제로 동작하고 tailwind 클래스 정렬도 붙어 있으니
  클래스 순서에 의미를 담지 말 것(`--fix`가 정렬한다).
- **실패 분기는 원인을 로그에 남기고 나서 응답한다.** Route Handler의 `catch`/`if (error)`에서 원본 에러를 버리면 재현될 때 단서가 0이다. Supabase의 `storage.remove()`처럼 **throw하지 않고 `{ error }`로 돌려주는 API**가 특히 잘 새어나간다 — 반환값을 구조분해해서 확인한다(2026-09-09 전체 리뷰에서 4곳이 한꺼번에 나왔다).
- **외부 호출에는 타임아웃과 캐싱 의도를 명시한다.** `fetch`는 기본 타임아웃이 없고 Anthropic SDK는 10분이다 — 그대로 두면 외부 서비스가 늘어질 때 화면이 그만큼 멈춘다. Nominatim은 `AbortSignal.timeout(5s)` + `next: { revalidate: 86400 }`, AI 게이트웨이는 `timeout: 15s` + `maxRetries: 1`.
- **죽은 코드는 주기적으로 정리한다.** `npm run check:unused`(ts-prune)로 확인한다. Next.js route export(`default`/`GET`/`POST`), 미들웨어 export(`src/proxy.ts`의 `proxy`/`config`), FSD `index.ts`의 public API export는 정상적인 false positive이니 그 외 항목만 본다.
- **결정과 시행착오는 이 폴더(`docs/`)에 폴더를 분류해 문서화한다.** 다음 세션·다른 agent가 같은 시행착오를 반복하지 않도록 하는 게 목적이다.
