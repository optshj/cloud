import { useState } from "react";

// 값이 null이 돼도 직전 값을 계속 돌려준다.
//
// Radix Dialog는 `open`이 false가 된 뒤에도 `data-state="closed"` 상태로 내용을 잠깐 더 그려야
// exit 애니메이션이 재생된다. 그런데 그 시점에 원본 데이터(목록에서 고른 항목)는 이미 null이라
// 그릴 게 없어진다 — 이 훅이 마지막 값을 붙잡아 애니메이션이 끝날 때까지 대신 그리게 한다.
// 호출부를 `{selected && <Modal/>}`로 두면 부모가 먼저 사라져서 exit가 아예 안 나오므로,
// Dialog는 상시 마운트하고 `open`만 토글하는 쪽과 한 쌍으로 쓴다.
//
// ref가 아니라 state로 붙잡는다 — 렌더 중 ref 접근은 React 컴파일러가 막는다(`Cannot access refs
// during render`). 렌더 중 setState는 같은 컴포넌트를 대상으로 할 때 React가 지원하는 패턴이고,
// 리렌더 한 번을 더 돌 뿐 effect와 달리 화면에 중간 상태가 안 비친다.
//
// 비교는 참조 동일성이다. 매 렌더 새 객체를 만들어 넘기면 무한 루프가 되니, 목록에서 찾아온
// 항목처럼 **참조가 안정적인 값**만 넘길 것.
export const useLastNonNull = <T>(value: T | null): T | null => {
  const [last, setLast] = useState<T | null>(null);
  if (value !== null && value !== last) {
    setLast(value);
  }
  return value ?? last;
};
