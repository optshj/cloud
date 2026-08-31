---
name: fsd-slice
description: cloud(구름 수집 서비스) 프로젝트에서 Feature-Sliced Design 슬라이스(entity/feature/widget/view)를 새로 만들거나 기존 슬라이스에 세그먼트를 추가할 때 사용. "새 entity 만들어줘", "feature 추가해줘", "widget/view 스캐폴딩" 같은 요청에 트리거.
---

## 절차

1. **레이어 결정**
   - `entities` — 명사형 비즈니스 도메인 (예: `cloud-entry`, `session`)
   - `features` — 동사형 사용자 행동, kebab-case (예: `capture-cloud`, `report-entry`, `share-card`)
   - `widgets` — 여러 feature/entity를 조합하는 화면 블록 (예: `app-shell`, `month-calendar`, `entry-card`)
   - `views` — 라우트 대응 화면 조합. Next.js 라우팅은 프로젝트 루트 `app/`가 맡고, `src/views`는 그 화면의 실제 UI 조합만 담당한다.

2. **세그먼트 폴더 생성** (실제로 쓰는 것만 — `entities`/`features`/`widgets`는 아래 패턴을 따른다)

   ```
   src/{layer}/{slice-name}/
   ├── ui/          # 컴포넌트 (PascalCase 파일명)
   ├── model/       # entities: *.types.ts, *.api.ts(Supabase 호출), *.queries.ts(쿼리키+useQuery), *.mutations.ts(useMutation), use-*.ts(TanStack Query로 안 맞는 구독 훅 — 예: auth 상태 리스너)
   ├── lib/         # features: 순수 로직/유틸 (캡처/변환 처리, 외부 API 호출 래핑 등)
   └── index.ts     # Public API — 외부에 노출할 것만 export
   ```

3. **Public API(`index.ts`) 규칙 — entities/features/widgets만 해당**
   - 슬라이스 외부에서 실제로 쓰는 항목만 export한다.
   - 다른 슬라이스에서 import할 때는 `@/entities/cloud-entry`처럼 index.ts를 통해서만 — 딥 임포트(`@/entities/cloud-entry/model/api`) 금지.

4. **레이어 간 import 규칙**
   - 방향: `shared → entities → features → widgets → views → app` (아래에서 위로 참조 금지 — 낮은 레이어가 높은 레이어를 모른다)
   - alias는 `@/{layer}/...` 형태(tsconfig `@*` → `./src/*`)를 그대로 쓴다. 
   - 동일한 슬라이스인 경우 상대 경로(`./model/api`)를 쓰고, 다른 슬라이스인 경우 절대 경로(`@/entities/cloud-entry/model/api`)를 쓴다. (상대 경로는 슬라이스 이동 시 깨지므로 금지)

5. **데이터 접근 — TanStack Query**
   - Supabase를 직접 호출하는 코드는 `entities/*/model/*.api.ts`에 둔다. UI 컴포넌트가 Supabase 클라이언트를 직접 import하지 않는다. Supabase 클라이언트 생성 규칙은 `supabase-patterns` 스킬 참고.
   - 서버 데이터 조회는 `entities/*/model/*.queries.ts`에 쿼리 키 팩토리 + `queryOptions`를 둔다. 팀 규모가 큰 프로젝트처럼 키를 별도 `*.keys.ts`로 안 뺀다 — 1인 프로젝트 규모에서는 같은 파일에 두는 걸로 충분하다(YAGNI). `queryFn`은 같은 슬라이스의 `*.api.ts` 함수를 그대로 쓴다.
   - 서버 데이터 변경(좋아요, 신고, 저장 등)은 `entities/*/model/*.mutations.ts`에 `useMutation` 훅으로 둔다. 성공 시 `*.queries.ts`가 export한 쿼리 키로 `invalidateQueries`한다.
   - UI 컴포넌트/feature는 `*.queries.ts`/`*.mutations.ts`가 내보낸 훅만 가져다 쓴다 — `*.api.ts`를 직접 호출하지 않는다.
   - 서버 데이터가 아닌 구독(예: `supabase.auth.onAuthStateChange`처럼 캐시할 "쿼리"가 아니라 이벤트 스트림)은 기존처럼 `model/use-*.ts` 훅으로 감싼다 — 억지로 TanStack Query에 끼워 맞추지 않는다.
   - 전역 `QueryClientProvider`는 `src/app/ui/QueryProvider.tsx`에 이미 설정돼 있다 — 슬라이스마다 새로 만들지 않는다.

6. 슬라이스를 다 만든 뒤 `npm run lint`로 확인한다.

## 예시 (feature)

```
src/features/{feature-name}/
├── ui/{Component}.tsx
└── index.ts   # export { Component } from './ui/{Component}'
```
