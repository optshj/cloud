// 클라이언트가 보내는 좌표는 `typeof === "number"`만으로 못 거른다 — NaN·Infinity·범위 밖 값이
// 그대로 통과해 Nominatim URL에 `lat=NaN`으로 실리거나(엉뚱한 502) DB에 그대로 저장된다.
// 위도/경도를 따로 두는 건 범위가 다르기도 하고, 타입 가드로 호출부에서 number로 좁히기 위해서다.
export const isValidLat = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 90;

export const isValidLng = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 180;
