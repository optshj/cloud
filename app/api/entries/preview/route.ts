import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { reverseGeocodeToDong } from "@/shared/lib/kakao/reverse-geocode";
import { generateAiComment } from "@/features/capture-cloud";

const BUCKET = "entry-photos";

// 미리보기 전용 — DB에 아무것도 저장하지 않는다. "기록하기"를 눌러야 /api/entries/confirm에서 저장된다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const body = await request.json();
  const { photoPath, lat, lng } = body as { photoPath?: string; lat?: number; lng?: number };
  if (!photoPath || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl;

  const [locationDong, aiComment] = await Promise.all([
    reverseGeocodeToDong(lat, lng).catch(() => null),
    generateAiComment(photoUrl),
  ]);

  if (!locationDong) {
    return NextResponse.json({ error: "위치 확인에 실패했어요" }, { status: 502 });
  }

  return NextResponse.json({ tag: aiComment.tag, comment: aiComment.comment, locationDong });
}
