import { describe, expect, it } from "vitest";
import { formatRegion } from "./reverse-geocode";

// 아래 셋은 실제 Nominatim 응답에서 가져온 조합이다 — 지역마다 채워지는 키가 달라서
// 우선순위가 어긋나면 "중구 태평로1가"(법정동)처럼 카카오와 다른 값이 나간다.
describe("formatRegion", () => {
  it("행정동(suburb)이 있으면 그걸 쓴다", () => {
    expect(
      formatRegion({ borough: "중구", suburb: "명동", quarter: "태평로1가", city: "서울특별시" }),
    ).toBe("중구 명동");
  });

  it("suburb가 없으면 법정동(quarter)으로 접고, borough가 없으면 city를 쓴다", () => {
    expect(formatRegion({ city: "제주시", quarter: "이도이동" })).toBe("제주시 이도이동");
  });

  it("동이 안 잡히면 상위 단위만 돌려준다", () => {
    expect(formatRegion({ city: "제주시" })).toBe("제주시");
  });

  it("아무것도 없으면 빈 문자열 — 호출부가 실패로 판정한다", () => {
    expect(formatRegion({})).toBe("");
  });
});
