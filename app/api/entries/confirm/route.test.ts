import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// confirm은 인증 확인 → 검증 → (entryDate/locationDong 서버 재계산) → insert → 에러 코드별 분기가 핵심.
// 클라이언트가 entryDate를 보내지 않는데도 서버가 seoulDateKey()로 "오늘"을 직접 계산한다는 계약(하루 1장 제한)을 반드시 검증한다.

const {
  mockGetUser,
  mockGetPublicUrl,
  mockStorageFrom,
  mockFrom,
  mockInsert,
  mockSelect,
  mockSingle,
  mockReverseGeocode,
  mockSeoulDateKey,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockStorageFrom: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockSingle: vi.fn(),
  mockReverseGeocode: vi.fn(),
  mockSeoulDateKey: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    storage: { from: mockStorageFrom },
    from: mockFrom,
  })),
}));

vi.mock("@/shared/lib/kakao/reverse-geocode", () => ({
  reverseGeocodeToDong: mockReverseGeocode,
}));

vi.mock("@/shared/lib/date", () => ({
  seoulDateKey: mockSeoulDateKey,
}));

import { POST } from "./route";

const makeRequest = (body: unknown): NextRequest => {
  return { json: async () => body } as unknown as NextRequest;
};

const validBody = {
  photoPath: "a.jpg",
  lat: 33.4,
  lng: 126.5,
  tag: "맑음",
  comment: "구름이 예뻐요",
};

describe("POST /api/entries/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageFrom.mockReturnValue({ getPublicUrl: mockGetPublicUrl });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://example.com/photo.jpg" } });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSeoulDateKey.mockReturnValue("2026-08-30");
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  it("로그인하지 않은 사용자는 401을 받는다", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "로그인이 필요해요" });
  });

  it.each([
    ["photoPath 누락", { ...validBody, photoPath: undefined }],
    ["lat이 숫자가 아님", { ...validBody, lat: "33.4" }],
    ["tag 누락", { ...validBody, tag: undefined }],
    ["comment 누락", { ...validBody, comment: undefined }],
  ])("%s이면 400을 받는다", async (_label, body) => {
    const res = await POST(makeRequest(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청이에요" });
  });

  it("위치 확인에 실패하면 502를 받고 insert는 시도하지 않는다", async () => {
    mockReverseGeocode.mockRejectedValue(new Error("카카오 API 실패"));

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "위치 확인에 실패했어요" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("entryDate는 클라이언트 값과 무관하게 서버가 seoulDateKey()로 재계산한다", async () => {
    mockReverseGeocode.mockResolvedValue("제주시 이도이동");
    mockSingle.mockResolvedValue({
      data: {
        id: "e1",
        entry_date: "2026-08-30",
        location_dong: "제주시 이도이동",
        tag: "맑음",
        comment: "구름이 예뻐요",
        photo_path: "a.jpg",
      },
      error: null,
    });

    // 바디에 entryDate 필드가 애초에 없다 — 그런데도 서버는 "오늘"을 직접 계산해야 한다.
    await POST(makeRequest(validBody));

    expect(mockSeoulDateKey).toHaveBeenCalledWith();
    expect(mockReverseGeocode).toHaveBeenCalledWith(33.4, 126.5);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        entry_date: "2026-08-30",
        location_dong: "제주시 이도이동",
        lat: 33.4,
        lng: 126.5,
        tag: "맑음",
        comment: "구름이 예뻐요",
        photo_path: "a.jpg",
      }),
    );
  });

  it("오늘 이미 기록이 있으면(unique violation) 409를 받는다", async () => {
    mockReverseGeocode.mockResolvedValue("제주시 이도이동");
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "오늘은 이미 기록했어요" });
  });

  it("unique violation이 아닌 insert 에러는 500을 받는다", async () => {
    mockReverseGeocode.mockResolvedValue("제주시 이도이동");
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "42P01", message: "relation missing" },
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "저장에 실패했어요" });
  });

  it("성공하면 좌표를 노출하지 않는 응답 shape을 반환한다", async () => {
    mockReverseGeocode.mockResolvedValue("제주시 이도이동");
    mockSingle.mockResolvedValue({
      data: {
        id: "e1",
        entry_date: "2026-08-30",
        location_dong: "제주시 이도이동",
        tag: "맑음",
        comment: "구름이 예뻐요",
        photo_path: "a.jpg",
      },
      error: null,
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      id: "e1",
      date: "2026-08-30",
      location: "제주시 이도이동",
      tag: "맑음",
      comment: "구름이 예뻐요",
      likes: 0,
      liked: false,
      photoDataUrl: "https://example.com/photo.jpg",
    });
    // privacy-security: 정확한 GPS 좌표는 응답에 담지 않는다
    expect(json).not.toHaveProperty("lat");
    expect(json).not.toHaveProperty("lng");
  });
});
