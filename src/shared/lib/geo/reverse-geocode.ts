// Nominatim 정책: 초당 1건 + 연락처가 담긴 User-Agent 필수.
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "cloud-diary/0.1 (+https://github.com/optshj/cloud)";

// 지역마다 채워지는 키가 달라 행정동(suburb) → 법정동(quarter) 순으로 본다.
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
  // 동이 없으면 상위 단위만 — 실패시키면 그 지역에선 기록이 막힌다.
  return [upper, dong].filter(Boolean).join(" ");
};

export const reverseGeocodeToDong = async (lat: number, lng: number): Promise<string> => {
  const url = `${ENDPOINT}?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&zoom=16`;
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
