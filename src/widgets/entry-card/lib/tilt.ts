// 손으로 앨범에 붙인 사진처럼 카드마다 각도를 조금씩 어긋나게 준다.
// index가 아니라 id로 각도를 정한다 — refresh로 목록 순서가 바뀌어도 같은 카드는 같은 기울기를 유지한다.
const TILTS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

export const tiltClass = (id: string): string => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TILTS[sum % TILTS.length];
};
