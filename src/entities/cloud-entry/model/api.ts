import { createClient } from "@/shared/lib/supabase/client";
import { seoulDateKey } from "@/shared/lib/date";
import type { CloudEntry } from "./types";

const BUCKET = "entry-photos";

type EntryFeedRow = {
  id: string;
  entry_date: string;
  location_dong: string;
  tag: string;
  comment: string;
  photo_path: string;
  likes_count: number;
  is_mine: boolean | null; // 비로그인이면 auth.uid()가 null이라 null로 온다
};

const toPublicUrl = (photoPath: string): string => {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl;
};

const toCloudEntry = (row: EntryFeedRow, liked: boolean): CloudEntry => {
  return {
    id: row.id,
    date: row.entry_date,
    location: row.location_dong,
    tag: row.tag,
    comment: row.comment,
    likes: row.likes_count,
    liked,
    isMine: row.is_mine ?? false,
    photoDataUrl: toPublicUrl(row.photo_path),
  };
};

// 공개 피드/캘린더 데이터. lat/lng은 절대 select하지 않는다 — 클라이언트로 위경도를 내려주지 않는다는 프라이버시 규칙.
export const fetchEntries = async (): Promise<CloudEntry[]> => {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from("entry_feed")
    .select("id, entry_date, location_dong, tag, comment, photo_path, likes_count, is_mine")
    .order("entry_date", { ascending: false });
  if (error) throw error;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  let likedIds = new Set<string>();
  if (userId && rows.length > 0) {
    const { data: likeRows } = await supabase
      .from("entry_likes")
      .select("entry_id")
      .eq("user_id", userId)
      .in(
        "entry_id",
        rows.map((r) => r.id),
      );
    likedIds = new Set((likeRows ?? []).map((r) => r.entry_id as string));
  }

  return rows.map((row) => toCloudEntry(row as EntryFeedRow, likedIds.has(row.id)));
};

// id도 같이 들고 온다 — 카메라 화면의 "오늘 다시 찍기"가 이 행을 지우고 그 자리에 다시 찍는다.
export type TodayEntryStatus = { id: string; comment: string } | null;

// "내가 오늘 이미 기록했는지" 확인 전용 — 다른 유저의 오늘 기록을 내 것으로 착각하면 안 되므로
// 소유 판정이 필요한데, user_id는 클라이언트가 읽을 수 없다(0004에서 컬럼 권한 회수). 대신
// 뷰가 서버에서 계산해주는 is_mine으로 거른다.
export const fetchMyTodayEntry = async (): Promise<TodayEntryStatus> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entry_feed")
    .select("id, comment")
    .eq("is_mine", true)
    .eq("entry_date", seoulDateKey())
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const toggleLikeRemote = async (entryId: string, currentlyLiked: boolean): Promise<void> => {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("로그인이 필요해요");

  if (currentlyLiked) {
    const { error } = await supabase
      .from("entry_likes")
      .delete()
      .eq("entry_id", entryId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("entry_likes")
      .insert({ entry_id: entryId, user_id: userId });
    if (error) throw error;
  }
};

// 경로가 불투명한 uuid라 uid+날짜로 재구성할 수 없다 — 삭제한 행이 알려주는 경로로 파일을 지운다.
// 행을 먼저 지우는 순서라 스토리지 삭제가 실패해도 사진 없는 기록이 남지는 않는다(반대는 남았다).
// 남의 글이면 RLS가 행 삭제를 막아 data가 null이고, 그러면 파일도 건드리지 않는다.
export const deleteEntryRemote = async (entryId: string): Promise<void> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cloud_entries")
    .delete()
    .eq("id", entryId)
    .select("photo_path")
    .maybeSingle();
  if (error) throw error;
  if (data) {
    // supabase-js는 스토리지 실패를 throw하지 않고 { error }로 돌려준다 — 버리면 사진만 남은
    // 고아 파일이 아무 흔적 없이 생긴다(버킷이 public이라 URL로 계속 서빙된다).
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([data.photo_path]);
    if (removeError) {
      console.error("cloud-entry: 사진 파일 삭제 실패", data.photo_path, removeError);
    }
  }
};

export const reportEntryRemote = async (entryId: string): Promise<void> => {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("로그인이 필요해요");

  const { error } = await supabase
    .from("entry_reports")
    .insert({ entry_id: entryId, reporter_id: userId });
  // 23505 = unique violation → 이미 신고한 경우, 조용히 성공 처리
  if (error && error.code !== "23505") throw error;
};
