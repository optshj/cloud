// index가 아니라 id 기준 — 목록 순서가 바뀌어도 같은 기울기.
const TILTS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

export const tiltClass = (id: string): string => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TILTS[sum % TILTS.length];
};
