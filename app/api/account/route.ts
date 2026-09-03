import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";

const BUCKET = "entry-photos";

// 탈퇴 즉시 전체 삭제(CLAUDE.md 필수 스펙, 유예기간 없음): 사진 파일 → auth 계정 순으로 지운다.
// DB 행(cloud_entries/entry_likes/entry_reports)은 auth.users FK의 on delete cascade로 같이 지워진다.
export const DELETE = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const admin = createAdminClient();

  const { data: files } = await admin.storage.from(BUCKET).list(user.id);
  if (files && files.length > 0) {
    await admin.storage.from(BUCKET).remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "탈퇴 처리에 실패했어요" }, { status: 500 });

  return new NextResponse(null, { status: 204 });
};
