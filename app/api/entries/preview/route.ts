import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { reverseGeocodeToDong } from "@/shared/lib/geo/reverse-geocode";
import { isValidLat, isValidLng } from "@/shared/lib/geo/coords";
import { generateAiComment } from "@/shared/lib/ai/generate-ai-comment";

const BUCKET = "entry-photos";

// 미리보기 전용 — DB에 아무것도 저장하지 않는다. "기록하기"를 눌러야 /api/entries/confirm에서 저장된다.
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
  const { photoPath, lat, lng } = body as { photoPath?: string; lat?: number; lng?: number };
  if (!photoPath || !isValidLat(lat) || !isValidLng(lng)) {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl;

  const [locationDong, aiComment] = await Promise.all([
    // 원인을 삼키면 502만 남아 지오코더 장애와 좌표 문제를 구분할 수 없다 —
    // 지오코더가 돌려준 메시지를 그대로 남긴다.
    reverseGeocodeToDong(lat, lng).catch((err) => {
      console.error("entries/preview: 역지오코딩 실패", { lat, lng }, err);
      return null;
    }),
    generateAiComment(photoUrl),
  ]);

  if (!locationDong) {
    return NextResponse.json({ error: "위치 확인에 실패했어요" }, { status: 502 });
  }

  return NextResponse.json({ tag: aiComment.tag, comment: aiComment.comment, locationDong });
};
