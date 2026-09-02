---
name: project-safari-permissions-query
description: navigator.permissions.query에 Safari가 모르는 PermissionName(camera 등)을 넘기면 동기 throw — .catch()로 못 잡는다
metadata:
  type: project
---

`navigator.permissions.query({ name: "camera" })`처럼 Safari(iOS/macOS)가 지원 안 하는
`PermissionName`을 넘기면, Promise가 reject되는 게 아니라 **호출 자체가 동기적으로 TypeError를
throw한다**(WebIDL enum 인자 검증이 함수 본문 실행 전에 일어남). 그래서

```js
navigator.permissions?.query({ name: "camera" }).then(...).catch(() => {});
```

이렇게 짜면 `.query(...)`가 던진 예외가 `.then`/`.catch` 체인에 도달하지 못하고 그대로
바깥으로 전파된다 — `useEffect` 안이면 uncaught exception이 되고, 이 프로젝트는
`error.tsx`/ErrorBoundary가 하나도 없어서(2026-09-02 기준) 해당 화면이 그대로 빈 화면이 된다.

**Why:** `src/features/capture-cloud/ui/CapturePermissionGate.tsx`(카메라+위치 권한 게이트,
2026-09-02 실기기 QA 대응으로 신규 추가) 최초 구현이 정확히 이 패턴이었다 — 의도는 "iOS Safari
폴백"이었는데 실제로는 그 브라우저에서 크래시하는 코드였다. `async () => { try { ... } catch {} }()`로
호출 자체를 try/catch 안에 넣어서 고쳤다(동기 throw와 promise rejection 둘 다 잡힘).

**How to apply:** `navigator.permissions.query(...)`를 새로 쓰는 diff(마이크 권한, 알림 권한
등)를 리뷰할 때는 `.catch()`만 있고 `.query()` 호출 자체가 try/catch 밖에 있는지 확인한다 —
있으면 🔴, Safari에서 재현 가능한 크래시다.
