export type CloudEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  location: string; // 동 단위로 변환된 위치 (원본 위경도는 서버에만 저장, 클라이언트로 내려주지 않음)
  tag: string; // AI가 붙인 짧은 태그 (예: "분홍 하늘")
  comment: string; // AI가 붙인 한 줄 코멘트 (예: "오늘 하늘 정말 맑아요")
  likes: number;
  liked: boolean;
  isMine: boolean; // 내가 올린 기록인지 — 신고/삭제 버튼 노출을 가른다. 비로그인은 항상 false
  // 실제로는 Supabase Storage의 public URL이 담긴다. 필드명은 위젯 쪽 diff를 줄이려고 그대로 유지.
  photoDataUrl?: string;
};
