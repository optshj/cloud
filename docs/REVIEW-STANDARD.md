# 코드 리뷰 표준

`code-reviewer` agent가 참조하는 체크리스트. 재사용 가능한 도메인 지식(App Router 패턴, 프라이버시/보안, 접근성, 에러 메시지)은 스킬로 분리했으니 여기서는 이 프로젝트에 고유한 체크만 다룬다 — 도메인 스킬은 `.claude/skills/`(`nextjs-app-router`, `privacy-security`, `accessibility`, `error-messages`) 참고.

`eslint.config.mjs`가 잡는 기계적 위반(네이밍, 화살표 함수, `===`, import 중복, FSD 레이어/딥임포트 경계)은 `npm run lint`로 끝난다 — 리뷰에서 재검사하지 않는다.

## 스코프 가드레일 (`docs/PRODUCT.md` 기준) — 위반 시 🔴

- 갤러리 업로드, 하루 다중 저장 추가 — 즉석 촬영 하루 1장은 서비스 정체성이다.
- 댓글, 팔로우, 알림, 구름 인식 정확도 검증 로직 추가 — 의도적으로 뺀 v1 스코프 밖. 요청 없이 만들지 않는다.
- 신고 버튼 + 누적 시 자동 숨김, 탈퇴 시 즉시 전체 삭제를 약화·누락시키는 변경.

## 상태 처리

- 촬영/업로드, 캘린더 조회, 피드 목록에서 로딩·에러·빈 상태 3종 누락 — 가장 자주 빠진다. 화면별 현재 현황과 표현 기준(스켈레톤은 실제 카드와 1:1, 로딩 중 "총 0장" 같은 확정값 금지)은 [`UI-SYSTEM.md`](UI-SYSTEM.md) 참고.

## 죽은 코드

- 이번 diff로 더는 쓰이지 않는 export가 남았는지 애매하면 `npm run check:unused`로 확인한다.

## 출력 (고정 템플릿)

🔴Critical / 🟡Warning / 🟢Suggestion / ✅자동수정. 특정 줄은 인라인, 광범위한 이슈는 요약으로.
**푸시 차단은 Critical만.**
