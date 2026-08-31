import { useCallback, useEffect, useState } from "react";
import { fetchEntries, toggleLikeRemote } from "./api";
import { CloudEntry } from "./types";

export function useCloudEntries() {
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await fetchEntries();
    setEntries(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEntries().then((list) => {
      if (!cancelled) {
        setEntries(list);
        setLoading(false);
      }
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
    } catch {
      // 실패하면 낙관적 업데이트 롤백
      setEntries((prev) => prev.map((e) => (e.id === id ? previous! : e)));
    }
  }, []);

  return { entries, loading, refresh, toggleLike };
}
