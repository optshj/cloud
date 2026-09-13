export type CloudEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  location: string; // 동 단위
  tag: string;
  comment: string;
  likes: number;
  liked: boolean;
  isMine: boolean;
  // 이름과 달리 Storage public URL이 담긴다.
  photoDataUrl?: string;
};
