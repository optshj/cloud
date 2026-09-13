import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudEntry } from "./types";

const { mockFetchEntries, mockOnAuthStateChange, mockUnsubscribe } = vi.hoisted(() => ({
  mockFetchEntries: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { onAuthStateChange: mockOnAuthStateChange },
  })),
}));

vi.mock("./api", () => ({
  fetchEntries: mockFetchEntries,
  toggleLikeRemote: vi.fn(),
}));

import { useCloudEntries } from "./use-cloud-entries";

const makeEntry = (id: string, isMine: boolean): CloudEntry => ({
  id,
  date: "2026-08-28",
  location: "제주시 이도이동",
  tag: "맑음",
  comment: "구름 한 점 없이 맑았던 하루",
  likes: 0,
  liked: isMine,
  isMine,
});

type AuthCallback = (event: string, session: { user: { id: string } } | null) => void;
let emitAuthChange: AuthCallback;

describe("useCloudEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockImplementation((callback: AuthCallback) => {
      emitAuthChange = callback;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });
  });

  it("로그아웃하면 캐시된 목록을 그대로 두지 않고 다시 불러온다", async () => {
    mockFetchEntries.mockResolvedValueOnce([makeEntry("a", true)]);
    const { result } = renderHook(() => useCloudEntries());

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0].isMine).toBe(true);

    emitAuthChange("INITIAL_SESSION", { user: { id: "u1" } });
    expect(mockFetchEntries).toHaveBeenCalledTimes(1);

    mockFetchEntries.mockResolvedValueOnce([makeEntry("a", false)]);
    emitAuthChange("SIGNED_OUT", null);

    await waitFor(() => expect(result.current.entries[0].isMine).toBe(false));
    expect(mockFetchEntries).toHaveBeenCalledTimes(2);
  });

  it("사용자가 그대로인 토큰 갱신에는 다시 불러오지 않는다", async () => {
    mockFetchEntries.mockResolvedValueOnce([makeEntry("a", true)]);
    const { result } = renderHook(() => useCloudEntries());
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    emitAuthChange("INITIAL_SESSION", { user: { id: "u1" } });
    emitAuthChange("TOKEN_REFRESHED", { user: { id: "u1" } });
    emitAuthChange("SIGNED_IN", { user: { id: "u1" } });

    expect(mockFetchEntries).toHaveBeenCalledTimes(1);
  });

  it("언마운트하면 auth 구독을 해제한다", async () => {
    mockFetchEntries.mockResolvedValueOnce([]);
    const { unmount } = renderHook(() => useCloudEntries());
    await waitFor(() => expect(mockFetchEntries).toHaveBeenCalled());

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
