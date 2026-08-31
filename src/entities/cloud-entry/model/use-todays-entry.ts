import { useEffect, useState } from "react";
import { fetchMyTodayEntry, type TodayEntryStatus } from "./api";

// 로그인한 사용자 본인의 "오늘 기록 여부"만 확인한다 — 공개 피드(useCloudEntries)와는 별개 조회.
export function useTodaysEntry(userId: string | undefined): TodayEntryStatus {
  const [entry, setEntry] = useState<TodayEntryStatus>(null);

  useEffect(() => {
    if (!userId) {
      setEntry(null);
      return;
    }
    let cancelled = false;
    fetchMyTodayEntry(userId).then((result) => {
      if (!cancelled) setEntry(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return entry;
}
