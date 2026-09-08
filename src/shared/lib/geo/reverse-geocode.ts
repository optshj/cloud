// OSM Nominatim으로 좌표 → 동 단위 위치를 얻는다.
// GET https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=&lon=&accept-language=ko&zoom=16
//
// 카카오 로컬 API에서 갈아탔다 — 카카오는 앱마다 "카카오맵" 제품을 켜야 하고(안 켜면
// 403 NotAuthorizedError) 키 관리가 따라붙는데, 이쪽은 키가 아예 없다.
// **정책상 지켜야 할 것:** 초당 1건, 그리고 연락처가 담긴 User-Agent 필수. 지금 호출량은
// 사용자당 하루 2건(preview + confirm 재계산)이라 여유롭다. 트래픽이 늘거나 상업화하면
// 자체 인스턴스나 유료 대안으로 옮긴다.
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "cloud-diary/0.1 (+https://github.com/optshj/cloud)";

// 응답의 행정구역 키는 지역마다 다르게 채워진다(실제 응답으로 확인):
//   제주 이도이동 → city=제주시, quarter=이도이동 (suburb 없음)
//   서울 명동     → borough=중구, suburb=명동, quarter=태평로1가(법정동)
//   부산 연산5동  → borough=연제구, suburb=연산5동
// 그래서 동은 행정동(suburb)을 먼저 보고 없을 때만 법정동(quarter)으로 접는다 —
// 카카오의 region_type="H" 우선과 같은 취지다.
type NominatimAddress = {
  suburb?: string;
  quarter?: string;
  neighbourhood?: string;
  borough?: string;
  city?: string;
  town?: string;
  county?: string;
};

export const formatRegion = (address: NominatimAddress): string => {
  const dong = address.suburb ?? address.quarter ?? address.neighbourhood;
  const upper = address.borough ?? address.city ?? address.town ?? address.county;
  // 동이 안 잡히는 지역(OSM 데이터가 얕은 시골 등)에선 상위 단위만이라도 돌려준다 —
  // 덜 구체적일 뿐 "정확한 좌표를 노출하지 않는다"는 결정과는 어긋나지 않고,
  // 여기서 실패시키면 그 지역에선 기록 자체가 막힌다.
  return [upper, dong].filter(Boolean).join(" ");
};

export const reverseGeocodeToDong = async (lat: number, lng: number): Promise<string> => {
  const url = `${ENDPOINT}?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&zoom=16`;
  // 좌표별 결과는 사실상 불변이라 하루 캐시가 자연스럽다(공개 Nominatim의 "초당 1건" 정책과도 맞다).
  // 타임아웃이 없으면 Nominatim이 늘어질 때 confirm/preview가 그대로 매달린다.
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Nominatim 실패: ${res.status}`);

  const data = (await res.json()) as { address?: NominatimAddress };
  const region = data.address ? formatRegion(data.address) : "";
  if (!region) throw new Error("위치 변환 결과가 없습니다");

  return region;
};
