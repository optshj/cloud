import { useCallback, useEffect, useState } from "react";
import { fetchEntries, toggleLikeRemote } from "./api";
import type { CloudEntry } from "./types";

export function useCloudEntries() {
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
}
