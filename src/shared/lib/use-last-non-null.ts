import { useState } from "react";

// Radix Dialog exit 애니메이션 동안 직전 값을 붙잡는다.
// Dialog는 상시 마운트하고 open만 토글할 것(`{selected && <Modal/>}`이면 exit가 안 나온다).
// 렌더 중 ref 접근은 React 컴파일러가 막아서 state로 든다.
// 참조 비교라 매 렌더 새 객체를 넘기면 무한 루프다.
export const useLastNonNull = <T>(value: T | null): T | null => {
  const [last, setLast] = useState<T | null>(null);
  if (value !== null && value !== last) {
    setLast(value);
  }
  return value ?? last;
};
