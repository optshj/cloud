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

function toPublicUrl(photoPath: string): string {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl;
}

function toCloudEntry(row: EntryFeedRow, liked: boolean): CloudEntry {
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
}

// 공개 피드/캘린더 데이터. lat/lng은 절대 select하지 않는다 — 클라이언트로 위경도를 내려주지 않는다는 프라이버시 규칙.
export async function fetchEntries(): Promise<CloudEntry[]> {
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
}

export type TodayEntryStatus = { comment: string } | null;

// "내가 오늘 이미 기록했는지" 확인 전용 — entry_feed(공개 피드, 전체 유저)가 아니라
// cloud_entries를 user_id로 직접 걸러서 다른 유저의 기록을 내 기록으로 착각하지 않게 한다.
export async function fetchMyTodayEntry(userId: string): Promise<TodayEntryStatus> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cloud_entries")
    .select("comment")
    .eq("user_id", userId)
    .eq("entry_date", seoulDateKey())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function toggleLikeRemote(entryId: string, currentlyLiked: boolean): Promise<void> {
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
}

// 업로드 경로가 항상 `{userId}/{entry_date}.jpg`로 고정돼 있어서(카메라 업로드 컨벤션),
// entryId를 지울 땐 본인 세션의 uid로 같은 경로를 재구성해 스토리지 파일도 같이 지운다.
export async function deleteEntryRemote(entryId: string, entryDate: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId) {
    await supabase.storage.from(BUCKET).remove([`${userId}/${entryDate}.jpg`]);
  }
  const { error } = await supabase.from("cloud_entries").delete().eq("id", entryId);
  if (error) throw error;
}

export async function reportEntryRemote(entryId: string): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("로그인이 필요해요");

  const { error } = await supabase
    .from("entry_reports")
    .insert({ entry_id: entryId, reporter_id: userId });
  // 23505 = unique violation → 이미 신고한 경우, 조용히 성공 처리
  if (error && error.code !== "23505") throw error;
}
