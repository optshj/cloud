// ponytail: 실제 학교 API Gateway(Claude vision) 호출 대신 더미 코멘트 풀에서 무작위 선택.
// 백엔드 연동 시 이 함수만 실제 API 호출로 교체하면 됨.
export const AI_COMMENT_POOL: { tag: string; comment: string }[] = [
  { tag: "기분 좋은 하루", comment: "오늘 하늘 정말 맑아요" },
  { tag: "햇살 가득", comment: "햇살이 좋은 하루예요" },
  { tag: "구름 산책", comment: "구름이 예쁘게 떠 있어요" },
  { tag: "몽글몽글", comment: "뭉게구름이 몽글몽글 피어났어요" },
  { tag: "토끼 발견", comment: "어? 토끼 모양 구름이네요" },
  { tag: "잔잔한 하늘", comment: "바람 한 점 없이 잔잔한 하늘이에요" },
];

export function pickRandomComment() {
  return AI_COMMENT_POOL[Math.floor(Math.random() * AI_COMMENT_POOL.length)];
}
