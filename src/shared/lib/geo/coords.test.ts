import { describe, expect, it } from "vitest";
import { isValidLat, isValidLng } from "./coords";

describe("isValidLat / isValidLng", () => {
  it("정상 좌표를 통과시킨다", () => {
    expect(isValidLat(37.5665)).toBe(true);
    expect(isValidLng(126.978)).toBe(true);
  });

  it("경계값을 포함한다", () => {
    expect(isValidLat(90)).toBe(true);
    expect(isValidLat(-90)).toBe(true);
    expect(isValidLng(180)).toBe(true);
    expect(isValidLng(-180)).toBe(true);
  });

  it("범위를 벗어나면 막는다", () => {
    expect(isValidLat(90.1)).toBe(false);
    expect(isValidLat(9999)).toBe(false);
    expect(isValidLng(180.1)).toBe(false);
  });

  it("숫자가 아니거나 유한하지 않으면 막는다 — 여기가 원래 뚫려 있던 자리다", () => {
    expect(isValidLat(NaN)).toBe(false);
    expect(isValidLng(Infinity)).toBe(false);
    expect(isValidLat("37.5")).toBe(false);
    expect(isValidLat(undefined)).toBe(false);
    expect(isValidLng(null)).toBe(false);
  });
});
