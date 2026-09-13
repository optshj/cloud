import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { reverseGeocodeToDong } from "@/shared/lib/geo/reverse-geocode";
import { isValidLat, isValidLng } from "@/shared/lib/geo/coords";
import { seoulDateKey } from "@/shared/lib/date";

const BUCKET = "entry-photos";
const TAG_MAX = 20;
const COMMENT_MAX = 100;

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "요청 본문(JSON)을 읽지 못했어요" }, { status: 400 });
  }
  const { photoPath, lat, lng, tag, comment } = body as {
    photoPath?: string;
    lat?: number;
    lng?: number;
    tag?: string;
    comment?: string;
  };
  if (!photoPath || !isValidLat(lat) || !isValidLng(lng) || !tag || !comment) {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }
  // 클라이언트를 거쳐 온 AI 값이라 길이라도 막는다.
  if (tag.length > TAG_MAX || comment.length > COMMENT_MAX) {
    return NextResponse.json(
      { error: `태그는 ${TAG_MAX}자, 코멘트는 ${COMMENT_MAX}자를 넘을 수 없어요` },
      { status: 400 },
    );
  }

  // 날짜(하루 1장 제한)·위치는 클라이언트 값을 믿지 않고 서버에서 재계산한다.
  const entryDate = seoulDateKey();
  let locationDong: string;
  try {
    locationDong = await reverseGeocodeToDong(lat, lng);
  } catch (err) {
    console.error("entries/confirm: 역지오코딩 실패", { lat, lng }, err);
    return NextResponse.json({ error: "위치 확인에 실패했어요" }, { status: 502 });
  }

  const { data: row, error } = await supabase
    .from("cloud_entries")
    .insert({
      user_id: user.id,
      entry_date: entryDate,
      location_dong: locationDong,
      lat,
      lng,
      tag,
      comment,
      photo_path: photoPath,
    })
    .select("id, entry_date, location_dong, tag, comment, photo_path")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "오늘은 이미 기록했어요" }, { status: 409 });
    }
    console.error(
      "entries/confirm: cloud_entries insert 실패",
      { userId: user.id, entryDate },
      error,
    );
    return NextResponse.json({ error: "저장에 실패했어요" }, { status: 500 });
  }

  const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(row.photo_path).data.publicUrl;

  return NextResponse.json({
    id: row.id,
    date: row.entry_date,
    location: row.location_dong,
    tag: row.tag,
    comment: row.comment,
    likes: 0,
    liked: false,
    photoDataUrl: photoUrl,
  });
};
