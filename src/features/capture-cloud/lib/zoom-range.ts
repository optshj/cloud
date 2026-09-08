// 기기가 광고하는 줌 capability를 슬라이더가 쓸 범위로 바꾼다. null이면 하드웨어 줌을 못 쓴다는 뜻.
export type ZoomRange = { min: number; max: number; step: number };

export const resolveZoomRange = (
  capability: Partial<ZoomRange> | undefined,
  fallbackStep: number,
): ZoomRange | null => {
  if (!capability || capability.min === undefined || capability.max === undefined) {
    return null;
  }
  // 범위가 한 점이면 당길 수 있는 게 없다. min이 0 이하면 배지의 "최소값 대비 배율"이 0으로
  // 나누기가 돼 Infinity가 뜬다 — 배율의 기준이 못 되는 범위이니 같이 거른다.
  if (capability.max <= capability.min || capability.min <= 0) {
    return null;
  }
  // step을 0이나 undefined로 주는 기기가 있다 — 그대로 두면 슬라이더가 한 칸도 안 움직인다.
  return {
    min: capability.min,
    max: capability.max,
    step: capability.step || fallbackStep,
  };
};
