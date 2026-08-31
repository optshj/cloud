import { describe, expect, it } from "vitest";
import { getMonthGrid, seoulDateKey } from "./date";

describe("seoulDateKey", () => {
  it("converts a UTC instant near midnight KST to the correct KST date", () => {
    // 2026-03-04 15:30 UTC = 2026-03-05 00:30 KST — 서버가 UTC로 돌 때 날짜가 하루 밀리는 경계 케이스.
    const utcNearMidnightKst = new Date("2026-03-04T15:30:00Z");
    expect(seoulDateKey(utcNearMidnightKst)).toBe("2026-03-05");
  });
});

describe("getMonthGrid", () => {
  it("always returns a length that is a multiple of 7", () => {
    for (let month = 0; month < 12; month++) {
      expect(getMonthGrid(2026, month).length % 7).toBe(0);
    }
  });

  it("marks only the requested month's own days as inMonth", () => {
    const cells = getMonthGrid(2026, 2); // 2026년 3월
    const inMonthDates = cells.filter((c) => c.inMonth).map((c) => c.date.getDate());
    expect(inMonthDates).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });
});
