import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { toast } from "sonner";
import { fetchEntries, toggleLikeRemote } from "./api";
import type { CloudEntry } from "./types";

export const useCloudEntries = () => {
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    fetchEntries()
      .then((list) => {
        if (!isCancelled) {
          setEntries(list);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("useCloudEntries initial fetch failed", err);
        if (!isCancelled) setError("기록을 불러오지 못했어요");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // is_mine·liked가 세션 기준이라 사용자가 바뀌면 재조회한다.
  // 토큰 갱신·탭 복귀에도 이벤트가 오므로 id를 비교한다.
  const userIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      const previousUserId = userIdRef.current;
      userIdRef.current = nextUserId;
      // INITIAL_SESSION은 최초 조회와 겹친다.
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
      console.error("cloud-entry: 좋아요 토글 실패", id, err);
      setEntries((prev) => prev.map((e) => (e.id === id ? previous! : e)));
      toast.error("좋아요를 반영하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }, []);

  return { entries, isLoading, error, refresh, toggleLike };
};
