# 테스트 결과 기록

e2e(Playwright) 실행 결과를 쌓아두는 폴더. 목적은 "언제, 무엇을, 어떤 결과로 테스트했는지"를 코드 밖에 남겨서 다음 세션이 같은 플로우를 다시 검증할 때 이전 시행착오(왜 이 케이스를 뺐는지, 뭐가 실패했었는지)를 반복하지 않게 하는 것. `npm run test:e2e` 콘솔 출력 자체는 휘발되니 여기 요약을 남긴다.

## 파일 규칙

- 실행 1회(또는 관련된 한 묶음) = 파일 1개: `YYYY-MM-DD-HHmm-<슬러그>.md` (예: `2026-08-30-2145-bottom-nav-smoke.md`)
  - 날짜만 쓰면 같은 날 여러 번 돌린 기록을 구분할 수 없어서 실행 시각(24시간, 콜론 없이 `HHmm`)까지 넣는다.
- 아래 항목을 포함한다:
  - **대상**: 어떤 플로우/스펙 파일을 돌렸는지 (`e2e/*.spec.ts`)
  - **커맨드**: 실제 실행한 명령
  - **결과**: 통과/실패 수, 실패했다면 원인
  - **범위 제외**: 이번에 다루지 않은 케이스와 이유(카메라 하드웨어·실제 로그인처럼 자동화 밖인 것 포함)
  - **다음에 볼 것**: 후속으로 필요한 케이스가 있으면 — 다만 실제 할 일은 [`../TODO.md`](../TODO.md)에 적고 여기선 가리키기만 한다

## 관련 문서

- 이 폴더에 언제·어떻게 기록하는지의 규칙 본문은 [`.claude/agents/test-writer.md`](../../.claude/agents/test-writer.md)에 있다(여기 README는 파일 형식 참고용).
- e2e 작성 방법: [`.claude/skills/playwright-e2e/SKILL.md`](../../.claude/skills/playwright-e2e/SKILL.md)
- 언제 e2e 대신 단위 테스트를 쓰는지: [`.claude/skills/vitest-testing/SKILL.md`](../../.claude/skills/vitest-testing/SKILL.md)
