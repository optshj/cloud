import { describe, expect, it } from "vitest";
import { resolveZoomRange } from "./zoom-range";

describe("resolveZoomRange", () => {
  it("정상 범위는 그대로 쓴다", () => {
    expect(resolveZoomRange({ min: 1, max: 8, step: 0.5 }, 0.1)).toEqual({
      min: 1,
      max: 8,
      step: 0.5,
    });
  });

  it("step이 0이거나 없으면 슬라이더가 멈추므로 fallback으로 채운다", () => {
    expect(resolveZoomRange({ min: 100, max: 400, step: 0 }, 0.1)?.step).toBe(0.1);
    expect(resolveZoomRange({ min: 100, max: 400 }, 0.1)?.step).toBe(0.1);
  });

  it("capability가 없거나 범위가 한 점이면 하드웨어 줌을 못 쓴다", () => {
    expect(resolveZoomRange(undefined, 0.1)).toBeNull();
    expect(resolveZoomRange({ min: 1, max: 1, step: 0.1 }, 0.1)).toBeNull();
    // min이 0이면 배지 배율(zoom / min)이 Infinity가 된다.
    expect(resolveZoomRange({ min: 0, max: 4, step: 0.1 }, 0.1)).toBeNull();
  });
});
