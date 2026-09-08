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

  // 바디가 JSON이 아니면 검증 전에 throw돼 로그 없는 500이 된다 — DB 실패와 구분이 안 된다.
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
  // AI가 만든 값이지만 클라이언트를 거쳐 오므로 서버는 그걸 믿지 않는다 — 공개 피드에 실리는
  // 텍스트라 길이만이라도 여기서 막는다(preview 결과와의 내용 대조는 아직 미정 — 남은 작업 문서 §2-11).
  if (tag.length > TAG_MAX || comment.length > COMMENT_MAX) {
    return NextResponse.json(
      { error: `태그는 ${TAG_MAX}자, 코멘트는 ${COMMENT_MAX}자를 넘을 수 없어요` },
      { status: 400 },
    );
  }

  // 클라이언트 값을 신뢰하지 않고 서버에서 직접 계산 — 오늘 날짜(하루 1장 제한)와 위치는 결정적이라 재계산 비용이 낮다.
  const entryDate = seoulDateKey();
  let locationDong: string;
  try {
    locationDong = await reverseGeocodeToDong(lat, lng);
  } catch (err) {
    // 원인을 삼키면 502만 남아 지오코더 장애와 좌표 문제를 구분할 수 없다 —
    // 지오코더가 돌려준 메시지를 그대로 남긴다.
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
