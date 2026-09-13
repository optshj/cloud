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
  is_mine: boolean | null;
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

// lat/lng은 절대 select하지 않는다(프라이버시).
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

export type TodayEntryStatus = { id: string; comment: string } | null;

// user_id는 클라이언트가 못 읽는다(migrations/0004) — 뷰의 is_mine으로 거른다.
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

// 행을 먼저 지운다 — RLS가 막으면 data가 null이라 파일도 건드리지 않는다.
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
    // storage는 throw하지 않고 { error }를 돌려준다.
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
  // 23505(unique violation) = 이미 신고함
  if (error && error.code !== "23505") throw error;
};
