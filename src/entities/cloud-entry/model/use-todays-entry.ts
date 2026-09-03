import { useEffect, useState } from "react";
import { fetchMyTodayEntry, type TodayEntryStatus } from "./api";

// 로그인한 사용자 본인의 "오늘 기록 여부"만 확인한다 — 공개 피드(useCloudEntries)와는 별개 조회.
export const useTodaysEntry = (userId: string | undefined): TodayEntryStatus => {
  // 결과를 "누구 것인지"와 함께 들고 있는다. userId가 바뀐 직후 effect가 setState로 지우게 하면
  // 렌더가 한 번 더 도는 데다(react-hooks/set-state-in-effect), 지우기 전 한 프레임 동안
  // 이전 계정의 "오늘 이미 기록함"이 그대로 보인다. 렌더에서 걸러내면 둘 다 없다.
  const [result, setResult] = useState<{ userId: string; entry: TodayEntryStatus } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;
    fetchMyTodayEntry(userId).then((entry) => {
      if (!isCancelled) setResult({ userId, entry });
    });
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return result !== null && result.userId === userId ? result.entry : null;
};
