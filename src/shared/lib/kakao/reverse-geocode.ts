// 카카오 로컬 API(coord2regioncode) 문서로 직접 확인한 스펙:
// GET https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x={lng}&y={lat}
// Header: Authorization: KakaoAK {REST_API_KEY}
// documents[].region_type이 "H"(행정동)인 항목의 region_2depth_name + region_3depth_name을 합치면
// "제주시 이도이동" 형태가 된다(제주처럼 구가 없는 지역도 region_2depth_name이 시 단위로 채워짐).
export async function reverseGeocodeToDong(lat: number, lng: number): Promise<string> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) throw new Error("KAKAO_REST_API_KEY가 설정되지 않았습니다");

  const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!res.ok) throw new Error(`카카오 로컬 API 실패: ${res.status}`);

  const data = (await res.json()) as {
    documents: Array<{
      region_type: "H" | "B";
      region_2depth_name: string;
      region_3depth_name: string;
    }>;
  };
  const dong = data.documents.find((d) => d.region_type === "H") ?? data.documents[0];
  if (!dong) throw new Error("위치 변환 결과가 없습니다");

  return [dong.region_2depth_name, dong.region_3depth_name].filter(Boolean).join(" ");
}
