import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
  mockGetUser,
  mockGetPublicUrl,
  mockStorageFrom,
  mockFrom,
  mockReverseGeocode,
  mockGenerateAiComment,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockStorageFrom: vi.fn(),
  mockFrom: vi.fn(),
  mockReverseGeocode: vi.fn(),
  mockGenerateAiComment: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    storage: { from: mockStorageFrom },
    from: mockFrom,
  })),
}));

vi.mock("@/shared/lib/geo/reverse-geocode", () => ({
  reverseGeocodeToDong: mockReverseGeocode,
}));

vi.mock("@/shared/lib/ai/generate-ai-comment", () => ({
  generateAiComment: mockGenerateAiComment,
}));

import { POST } from "./route";

const makeRequest = (body: unknown): NextRequest => {
  return { json: async () => body } as unknown as NextRequest;
};

describe("POST /api/entries/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue({ getPublicUrl: mockGetPublicUrl });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://example.com/photo.jpg" } });
  });

  it("로그인하지 않은 사용자는 401을 받는다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ photoPath: "a.jpg", lat: 33.4, lng: 126.5 }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "로그인이 필요해요" });
  });

  it.each([
    ["photoPath 누락", { lat: 33.4, lng: 126.5 }],
    ["lat이 숫자가 아님", { photoPath: "a.jpg", lat: "33.4", lng: 126.5 }],
    ["lng가 숫자가 아님", { photoPath: "a.jpg", lat: 33.4, lng: null }],
  ])("%s이면 400을 받는다", async (_label, body) => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청이에요" });
  });

  it("위치 확인에 실패하면 502를 받는다 (AI 코멘트 성공 여부와 무관)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockReverseGeocode.mockRejectedValue(new Error("카카오 API 실패"));
    mockGenerateAiComment.mockResolvedValue({ tag: "맑음", comment: "좋아요" });

    const res = await POST(makeRequest({ photoPath: "a.jpg", lat: 33.4, lng: 126.5 }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "위치 확인에 실패했어요" });
  });

  it("성공하면 tag/comment/locationDong만 반환하고 DB는 건드리지 않는다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockReverseGeocode.mockResolvedValue("제주시 이도이동");
    mockGenerateAiComment.mockResolvedValue({ tag: "맑음", comment: "구름이 예뻐요" });

    const res = await POST(makeRequest({ photoPath: "a.jpg", lat: 33.4, lng: 126.5 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      tag: "맑음",
      comment: "구름이 예뻐요",
      locationDong: "제주시 이도이동",
    });
    expect(mockGenerateAiComment).toHaveBeenCalledWith("https://example.com/photo.jpg");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
