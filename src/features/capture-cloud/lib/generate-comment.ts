// AI 코멘트 실패 시의 폴백 풀. 게이트웨이 호출은 generate-ai-comment.ts가 하고,
// 키가 없거나 호출/파싱이 실패할 때 여기로 떨어진다 — 지우거나 API 호출로 갈아끼우지 말 것.
const AI_COMMENT_POOL: { tag: string; comment: string }[] = [
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
