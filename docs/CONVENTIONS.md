# 개발 컨벤션

이 프로젝트의 시행착오·결정을 쌓아두는 지식 저장소. 새 규칙이 생기면 코드가 아니라 여기 먼저 적는다.

## 원칙

- **아키텍처는 문서가 아니라 도구로 규약한다.** FSD 레이어 방향·딥임포트 금지는 `eslint.config.mjs`가 강제한다(`import/no-restricted-paths`, `import/no-internal-modules`) — 규칙을 바꾸려면 그 파일을 고친다.
- **오류 메시지는 구체적으로 작성한다.** "실패했습니다" 금지 — 무엇이 왜 실패했는지 원인이 드러나야 피드백 루프가 돈다.
- **죽은 코드는 주기적으로 정리한다.** `npm run check:unused`(ts-prune)로 확인한다. Next.js route export(`default`/`GET`/`POST`)와 FSD `index.ts`의 public API export는 정상적인 false positive이니 그 외 항목만 본다.
- **결정과 시행착오는 이 폴더(`docs/`)에 문서화한다.** 다음 세션·다른 agent가 같은 시행착오를 반복하지 않도록 하는 게 목적이다.
