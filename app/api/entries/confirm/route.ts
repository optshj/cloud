import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { reverseGeocodeToDong } from "@/shared/lib/kakao/reverse-geocode";
import { seoulDateKey } from "@/shared/lib/date";

const BUCKET = "entry-photos";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const body = await request.json();
  const { photoPath, lat, lng, tag, comment } = body as {
    photoPath?: string;
    lat?: number;
    lng?: number;
    tag?: string;
    comment?: string;
  };
  if (!photoPath || typeof lat !== "number" || typeof lng !== "number" || !tag || !comment) {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  // 클라이언트 값을 신뢰하지 않고 서버에서 직접 계산 — 오늘 날짜(하루 1장 제한)와 위치는 결정적이라 재계산 비용이 낮다.
  const entryDate = seoulDateKey();
  let locationDong: string;
  try {
    locationDong = await reverseGeocodeToDong(lat, lng);
  } catch {
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
}
