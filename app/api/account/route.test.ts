import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockRpc, mockEq, mockRemove, mockDeleteUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRpc: vi.fn(),
  mockEq: vi.fn(),
  mockRemove: vi.fn(),
  mockDeleteUser: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: () => ({ select: () => ({ eq: mockEq }) }),
    storage: { from: () => ({ remove: mockRemove }) },
    auth: { admin: { deleteUser: mockDeleteUser } },
  }),
}));

import { DELETE } from "./route";

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockRpc.mockResolvedValue({ data: ["owned.jpg", "shared.jpg"], error: null });
    mockEq.mockResolvedValue({
      data: [{ photo_path: "shared.jpg" }, { photo_path: "orphan-owner.jpg" }],
      error: null,
    });
    mockRemove.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
  });

  it("업로더 목록과 내 기록의 photo_path를 합쳐 중복 없이 지운다", async () => {
    const res = await DELETE();

    expect(res.status).toBe(204);
    expect(mockRemove).toHaveBeenCalledWith(["owned.jpg", "shared.jpg", "orphan-owner.jpg"]);
    expect(mockDeleteUser).toHaveBeenCalledWith("u1");
  });

  it("photo_path 조회가 실패하면 계정을 지우지 않고 멈춘다", async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: "boom" } });

    const res = await DELETE();

    expect(res.status).toBe(500);
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
