# CLAUDE.md

> 개발 컨벤션·리뷰 기준은 `docs/`가 진실 소스. 이 파일은 그것을 참조 + 프로젝트 개요/오케스트레이션만 담는다.

@AGENTS.md
@docs/CONVENTIONS.md
@docs/REVIEW-STANDARD.md

## 개요

구름 수집 서비스 — 매일 하늘/구름을 즉석 촬영하면 AI가 러프한 감성 코멘트를 붙여 캘린더에 기록하는 개인 다이어리 앱.

제품 스펙(기능 결정, 디자인 스타일, 핵심 루프)은 [`docs/PRODUCT.md`](docs/PRODUCT.md)가 유일한 기준이다. 이 문서는 개발/프로세스 관련 내용만 다룬다.

**열려 있는 작업은 [`docs/TODO.md`](docs/TODO.md) 한 곳에서만 관리한다** — 미정 사항·알려진 한계·후속 테스트까지 전부 거기 모았다. 다른 문서에 새 TODO를 적지 않는다.

## 기술 스택 (계획)

- Next.js(프론트+API) + Supabase(Auth/Postgres/Storage)
- AI 코멘트: 학교 API Gateway 경유
  - Base URL: `https://factchat-cloud.mindlogic.ai/v1/gateway/claude` (Anthropic Messages API 호환)
  - 인증: `x-api-key` 헤더로 API 키 전달 — Anthropic SDK를 그대로 쓰고 `base_url`만 교체
  - 비용 절감을 위해 저렴한 모델(haiku급)부터 시작
- 플랫폼: 웹 우선(반응형). 추후 웹뷰로 감싸 모바일 앱화 예정이므로 지금부터 네이티브 전용 웹 API에 기대지 않는다

스코프 가드레일·리뷰 체크리스트는 위 `@docs/REVIEW-STANDARD.md` 참고 (별도 절로 중복 서술하지 않는다).

## 작업 유형별 agent

| 신호 | agent |
|---|---|
| 화면/컴포넌트 구현 (FSD entity/feature/widget/view) | `frontend-dev` |
| Supabase 연동, Route Handler(`app/api/**`), AI Gateway | `api-developer` |
| 테스트 작성·수정 (수정은 안 함) | `test-writer` |
| "리뷰해줘", 커밋/푸시 전 | `code-reviewer` — **CI가 없으므로 푸시 전 1회 실행이 규약이다** |
| "QA 돌려줘", 플로우 점검 | `qa` — `docs/FLOWS.md` 기준으로 실제 브라우저를 구동해 훑어보고, 발견한 문제를 GitHub 이슈(`qa-bug` 라벨)로 등록만 한다. 코드는 고치지 않는다 |
| "이슈 고쳐줘", QA 이슈 처리 | `fix-qa-issue` 스킬 — `qa-bug` 이슈를 가져와 `frontend-dev`/`api-developer`에게 위임하고, `code-reviewer` 통과 후 커밋 + main에 직접 push까지 한다(push되면 `Fixes #<n>`로 이슈 자동 닫힘) |
| "문서 정리해줘", 문서가 서로 어긋날 때 | `doc-keeper` — `docs/*.md`의 중복을 문서 머리말이 선언한 관할대로 병합하고 죽은 참조를 정리한다. 코드는 고치지 않고, 커밋 + main push까지 한다 |

agent 모두 상세 규칙은 `docs/`와 `.claude/skills/`를 참조한다 — 이 표는 라우팅용이고 규칙 본문은 여기 복붙하지 않는다.
