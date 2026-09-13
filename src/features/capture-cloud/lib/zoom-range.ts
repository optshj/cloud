export type ZoomRange = { min: number; max: number; step: number };

// null = 하드웨어 줌 불가
export const resolveZoomRange = (
  capability: Partial<ZoomRange> | undefined,
  fallbackStep: number,
): ZoomRange | null => {
  if (!capability || capability.min === undefined || capability.max === undefined) {
    return null;
  }
  // min <= 0이면 배율(zoom / min)이 Infinity가 된다.
  if (capability.max <= capability.min || capability.min <= 0) {
    return null;
  }
  // step을 0으로 주는 기기가 있다.
  return {
    min: capability.min,
    max: capability.max,
    step: capability.step || fallbackStep,
  };
};
