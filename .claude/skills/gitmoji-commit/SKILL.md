---
name: gitmoji-commit
description: cloud(구름 수집 서비스)에서 작업을 마치고 커밋할 때 사용. lint 통과 등 완료 기준을 채운 뒤 커밋 메시지를 gitmoji 컨벤션으로 쓸 때 트리거.
---

# gitmoji 커밋 (cloud)

로컬에 [gitmoji-cli](https://github.com/carloscuesta/gitmoji-cli)가 설치돼 있다 — 실제 이모지 목록의 source of truth로 쓴다(아래 표를 임의로 확장하지 않는다). 전체 목록은 `gitmoji -l`, 키워드 검색은 `gitmoji -s <키워드>`.

## 커밋할 때

1. **에이전트는 `gitmoji -c`(인터랙티브 선택)를 쓰지 않는다** — 프롬프트를 받을 수 없다. 아래 표에서 해당하는 이모지를 직접 골라 `git commit -m "{이모지} 무엇/왜 요약"`으로 커밋한다.
2. 표에 애매하게 걸치면 `gitmoji -s <키워드>`로 검색해서 가장 가까운 공식 이모지를 찾는다 — 표에 없다고 이모지를 지어내지 않는다.
3. 변경 성격이 여러 개면(예: 기능 추가 + 그 과정에서 리팩토링) 커밋을 성격별로 쪼갠다 — 이모지 하나에 여러 성격을 억지로 욱여넣지 않는다.
4. 커밋 후 `git push`까지 한다 — 지금은 main에 직접 푸시한다(그 전에 `code-reviewer` 1회 실행은 여전히 규약).
5. **통과했으면 "커밋할까요?" 되묻지 않는다** — `code-reviewer`를 통과했으면 매번 확인 없이 커밋·push까지 진행한다. 예외적으로 먼저 확인하는 경우: 마이그레이션·스키마처럼 되돌리기 어려운 변경, `git push --force`.

## 이 프로젝트에서 자주 쓸 것

애매하면 `gitmoji -s`로 검색해서 가장 가까운 공식 이모지를 쓴다:

| 이모지 | 코드 | 용도 |
| --- | --- | --- |
| ✨ | `:sparkles:` | 새 기능 |
| 🐛 | `:bug:` | 버그 수정 |
| ♻️ | `:recycle:` | 동작 변화 없는 리팩토링 |
| ✅ | `:white_check_mark:` | 테스트 추가/수정 |
| 📝 | `:memo:` | 문서 |
| 🎨 | `:art:` | 코드 구조/포맷 개선 |
| 🔧 | `:wrench:` | 설정 파일 (eslint, tsconfig, CI 등) |
| 🔥 | `:fire:` | 코드/파일 삭제 |
| ⚰️ | `:coffin:` | 죽은 코드 제거 (`check:unused`로 찾은 것 등) |
| 🚑️ | `:ambulance:` | 급한 핫픽스 |
| 🔒️ | `:lock:` | 보안/프라이버시 관련 수정 |
| ♿️ | `:wheelchair:` | 접근성 개선 |
| 🚨 | `:rotating_light:` | lint/컴파일 경고 수정 |
| 🚚 | `:truck:` | 파일/슬라이스 이동·이름 변경 |

## 완료 기준

`git log -1`로 커밋이 gitmoji 형식(`{이모지} 요약`)으로 만들어졌는지 확인한다.
