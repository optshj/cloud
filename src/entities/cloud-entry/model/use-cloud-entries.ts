import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { fetchEntries, toggleLikeRemote } from "./api";
import type { CloudEntry } from "./types";

export const useCloudEntries = () => {
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchEntries();
      setEntries(list);
      setError(null);
    } catch (err) {
      console.error("useCloudEntries refresh failed", err);
      setError("기록을 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEntries()
      .then((list) => {
        if (!cancelled) {
          setEntries(list);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("useCloudEntries initial fetch failed", err);
        if (!cancelled) setError("기록을 불러오지 못했어요");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 목록은 로그인한 사람이 누구냐에 따라 내용이 달라진다 — is_mine과 liked를 서버가
  // 세션 기준으로 계산해서 내려주기 때문이다. 그래서 로그아웃해도 목록을 그대로 두면
  // 남의 브라우저에 내 기록이 "내 것"으로 남는다(사진첩이 안 비고, 하트도 눌린 채다).
  // 로그인/로그아웃으로 사용자가 실제로 바뀔 때만 다시 불러온다 —
  // 토큰 갱신(TOKEN_REFRESHED)이나 탭 복귀에도 이벤트가 오므로 id를 비교해서 걸러낸다.
  const userIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      const previousUserId = userIdRef.current;
      userIdRef.current = nextUserId;
      // 첫 이벤트(INITIAL_SESSION)는 위 최초 조회와 겹치므로 건너뛴다.
      if (previousUserId === undefined || previousUserId === nextUserId) return;
      void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const toggleLike = useCallback(async (id: string) => {
    let previous: CloudEntry | undefined;
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        previous = e;
        return { ...e, liked: !e.liked, likes: e.likes + (e.liked ? -1 : 1) };
      }),
    );
    if (!previous) return;
    try {
      await toggleLikeRemote(id, previous.liked);
    } catch (err) {
      console.error("toggleLike failed", err);
      // 실패하면 낙관적 업데이트 롤백
      setEntries((prev) => prev.map((e) => (e.id === id ? previous! : e)));
    }
  }, []);

  return { entries, loading, error, refresh, toggleLike };
};
