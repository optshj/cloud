---
name: shadcn-component
description: cloud(구름 수집 서비스) 프로젝트에서 버튼·다이얼로그·스켈레톤 같은 기본 UI 프리미티브를 shadcn/ui로 추가하거나 커스터마이즈할 때 사용. "버튼 컴포넌트 만들어줘", "모달을 shadcn으로 바꿔줘", "shadcn 추가", "confirm 창 좀 제대로" 같은 요청에 트리거.
---

# shadcn 컴포넌트 — cloud

이 프로젝트는 shadcn/ui를 **소스를 복사해와서 네오브루탈리즘 톤으로 뜯어고쳐** 쓴다. npm 의존성이 아니라 `src/shared/ui/`에 들어오는 우리 코드다 — 생성 직후 상태 그대로 두지 않는다.

세팅은 이미 끝나 있다(`components.json`, `src/shared/lib/cn.ts`, `globals.css` 토큰). 다시 `init`하지 않는다.

## 언제 쓰고, 언제 안 쓰는가

- **shadcn으로 간다**: 접근성 배선이 까다로운 것 — 다이얼로그(포커스 트랩·Escape·스크롤 잠금), 확인창, 드롭다운, 툴팁. 그리고 호출부에 반복 복붙되는 프리미티브(버튼).
- **직접 만든다**: 이 서비스 고유의 폴라로이드 카드(`EntryListCard`, `EntryFeedCard`), 캘린더 그리드, 카메라 UI. shadcn에 대응물이 없고 있어도 걷어내는 게 더 크다.
- **`window.confirm` / `window.alert`는 쓰지 않는다** — 브라우저 기본 창은 톤을 깨고 웹뷰 앱화 시 더 어색해진다. `alert-dialog`로 대체한다.

## 추가 절차

```bash
npx shadcn@latest add <component> --yes
```

`components.json`의 alias가 FSD 경로로 잡혀 있어 파일은 `src/shared/ui/<component>.tsx`(kebab-case)로 떨어진다. 그다음 **반드시** 아래 5단계를 거친다. 생략하면 화면이 깨지거나 lint가 막힌다.

### 1. radix 의존성이 실제로 깔렸는지 확인한다

CLI가 "Installing dependencies ✔"를 찍고도 `radix-ui`를 `package.json`에 안 넣는 경우가 있다(실제로 겪음). import가 있는데 패키지가 없으면 런타임에서 터진다.

```bash
node -e "console.log(require('./package.json').dependencies['radix-ui'])"
# undefined면: npm i radix-ui
```

### 2. 기본 스타일을 브루탈 톤으로 치환한다

shadcn 기본값(둥근 모서리 + 얇은 회색 테두리 + soft shadow)은 이 프로젝트와 **정반대**다. `src/shared/ui/tokens.ts`의 `BRUTAL`/`BRUTAL_SM`을 기준으로 갈아끼운다.

| 생성 코드 | 이 프로젝트 |
|---|---|
| `rounded-md`, `rounded-lg` | 지운다 (각진 모서리가 기본. `--radius: 0`이라 무해하지만 노이즈니 제거) |
| `border` / `border-input` | `border-2 border-black` 또는 `border-[3px] border-black` |
| `shadow-xs`, `shadow-sm` | `shadow-[3px_3px_0_0_#000]` / `shadow-[5px_5px_0_0_#000]` (= `BRUTAL_SM` / `BRUTAL`) |
| `hover:bg-*/90` | 프레스 피드백으로 교체 — `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` (터치엔 hover가 없다) |
| `dark:*` | 전부 지운다 — 다크 모드는 제품 스펙에 없다 |
| `animate-pulse bg-accent` | `.skeleton` 클래스 (`globals.css`) — 하드섀도 위의 opacity pulse는 카드가 깨진 것처럼 보인다 |
| `font-medium` | `font-bold` / `font-extrabold` |
| `animate-in`, `fade-in-0`, `zoom-in-95` | **이 프로젝트엔 `tailwindcss-animate` 플러그인이 없다.** 그대로 두면 아무것도 안 하는 클래스로 조용히 컴파일된다 → `globals.css`에 정의된 `--animate-modal-in/out`, `--animate-overlay-in/out` 사용 |
| `DialogContent`의 카드 스타일 (`bg-background p-6 rounded-lg border shadow-lg`) | 지운다. `DialogContent`는 **위치잡기 + data-state 모션만** 맡고, 카드(폴라로이드·카드더미 등)는 호출부가 그린다 — 이 서비스는 모달 연출이 화면마다 다르다 |

색은 `globals.css`의 시맨틱 토큰에 이미 매핑돼 있으니 `bg-primary`(연보라) `bg-accent`(노랑) `bg-destructive`(로즈)는 그대로 두면 된다. 새 색을 하드코딩하지 말고 토큰을 먼저 본다.

### 3. lint 규칙에 맞춘다

생성 코드는 이 레포의 규칙을 지키지 않는다. 파일당 5~10건씩 뜬다.

```bash
npx eslint src/shared/ui/<component>.tsx --fix   # prettier(세미콜론 등)는 이걸로 끝
```

`--fix`로 **안 되는 것**은 손으로 고친다. 아래 4개는 `add`로 받은 파일에서 거의 매번 재현된다:

- `function Button(...) {}` → `const Button = (...) => {}` (`no-restricted-syntax`: 함수 선언식 금지)
- `import * as React from "react"` → `no-restricted-imports`(React default import 금지)에 걸린다. 필요한 타입만 `import type { ComponentProps } from "react"`로 가져온다.
- `const Comp = asChild ? Slot.Root : "button"` → `naming-convention`(변수는 camelCase/UPPER_CASE). 타입이 함수 유니온이라 PascalCase 예외에도 안 걸리니 **삼항을 분기로 풀어야** 통과한다.
- boolean 변수는 `is`/`has`/`should` 접두사가 필요하다.
- export 문은 파일 하단 `export { Button, buttonVariants }` 형태를 유지해도 된다.

**eslint ignore로 덮지 않는다.** `src/shared/ui/`는 우리 코드지 vendor 디렉터리가 아니다.

### 4. Public API로 내보낸다

`src/shared/ui/`는 FSD `shared` 레이어라 딥 임포트가 허용되지만(`import/no-restricted-paths`의 forbid 대상이 아님), 호출부는 파일 경로를 그대로 쓴다:

```ts
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
```

`widgets`/`features`/`entities`와 달리 `shared/ui`에는 배럴 `index.ts`를 만들지 않는다 — 트리셰이킹을 막고 shadcn 파일이 늘어날수록 관리 지점만 하나 더 생긴다.

### 5. 스토리를 같이 추가한다

`src/shared/ui/<component>.stories.tsx`. 프리미티브를 눈으로 확인할 유일한 자리다 — 이걸 빼면
화면에 실제로 붙여보기 전까진 아무도 못 본다.

```bash
npm run storybook   # http://localhost:6006
```

- **`title`은 `shared/ui/<Component>`**로 맞춘다(사이드바 그룹이 갈린다).
- **export 이름이 곧 스토리 이름이다.** 한글 이름을 쓰고 싶으면 export는 ASCII PascalCase로 두고
  `name: "한글 이름"`으로 넘긴다 — `eslint.config.mjs`가 스토리 파일에만 PascalCase를 허용한다.
- **바꾼 기본값을 스토리로 남긴다.** 위 표에서 갈아끼운 것(스켈레톤 광택, 프레스 피드백, 44px 규격)이
  왜 그런지는 나란히 놓고 봐야 읽힌다. `parameters.docs.description.component`에 근거 링크를 적는다.
- 상태를 들어야 하는 컴포넌트(모달 등)는 스토리 파일 안에 작은 `*Demo` 래퍼를 두고 그걸 `component`로
  쓴다. Radix 모달은 **상시 마운트 + `open` 토글**이라야 exit가 재생되므로 스토리도 그 형태로 쓴다.

## 모션과 겹칠 때

Radix Dialog는 `data-state="open|closed"` 속성을 주므로 **간단한 enter/exit는 CSS만으로 끝난다**. `framer-motion`의 `AnimatePresence`로 Radix Dialog를 감싸면 언마운트 타이밍이 어긋나 exit가 씹힌다. 둘을 겹치지 말고 하나를 고른다:

- 다이얼로그 열고닫기 → **Radix + CSS** (`data-state` + `globals.css`의 `--animate-modal-*`)
- 리스트 stagger, 좋아요 하트 팝, 드래그 → **framer-motion** (`interaction-design` 스킬)

**exit 애니메이션이 안 나오는 조건**: 호출부가 `{selected && <Modal/>}`처럼 조건부 마운트하면 부모가 먼저 사라져서 Radix가 닫힘 모션을 재생할 틈이 없다. **2026-09-03에 두 모달을 상시 마운트 + `open` 토글로 바꿨다** — 새 모달도 같은 형태로 쓴다(조건부 마운트로 되돌리면 exit가 조용히 사라진다). 닫히는 동안 그릴 데이터가 없어지는 문제는 `shared/lib/use-last-non-null.ts`가 맡는다.

## 하지 않는 것

- `npx shadcn init` 재실행 — `globals.css`의 우리 토큰 매핑을 shadcn 기본 테마(oklch 40여 개)로 덮어쓴다.
- `components.json`의 `cssVariables`를 `false`로 바꾸기 — `bg-oklch(0.205 0 0)` 같은 **컴파일 안 되는 클래스**가 생성된다(실제로 겪음). 반드시 `true`.
- `.dark` 블록이나 `dark:` 클래스 추가 — 다크 모드는 스코프 밖(`docs/PRODUCT.md`).
- 안 쓰는 컴포넌트 미리 add 해두기 — 필요할 때 한 개씩 가져온다.
