import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudEntry } from "./types";

// 목록 내용은 "지금 로그인한 사람이 누구냐"에 따라 달라진다(is_mine·liked를 서버가 세션 기준으로
// 계산한다). 그래서 이 훅은 최초 1회 조회로 끝나면 안 되고 로그아웃/로그인에 반응해야 한다.
// api와 supabase 클라이언트를 모듈 단위로 모킹해 그 재조회 규칙만 본다.

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

// onAuthStateChange에 등록된 콜백을 붙잡아 로그인/로그아웃 이벤트를 직접 흘려보낸다.
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

    // 로그인 상태로 최초 조회가 끝난 시점
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0].isMine).toBe(true);

    // 마운트 직후의 INITIAL_SESSION은 최초 조회와 겹치므로 재조회를 유발하지 않아야 한다.
    emitAuthChange("INITIAL_SESSION", { user: { id: "u1" } });
    expect(mockFetchEntries).toHaveBeenCalledTimes(1);

    // 로그아웃 — 서버가 is_mine을 false로 다시 계산해준다.
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
