import { useEffect, useState } from "react";
import { fetchMyTodayEntry, type TodayEntryStatus } from "./api";

export const useTodaysEntry = (userId: string | undefined): TodayEntryStatus => {
  // userId와 함께 들고 렌더에서 거른다 — effect로 지우면 이전 계정 결과가 한 프레임 보인다.
  const [result, setResult] = useState<{ userId: string; entry: TodayEntryStatus } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;
    fetchMyTodayEntry().then((entry) => {
      if (!isCancelled) setResult({ userId, entry });
    });
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return result !== null && result.userId === userId ? result.entry : null;
};
