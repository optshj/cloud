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

  // 경로에 uid가 없어져서 폴더 목록으로는 못 찾는다(→ supabase/migrations/0004). 두 목록을 합친다:
  // - 업로더(owner_id) 기준: 기록까지 안 간 사진(미리보기 후 이탈)을 여기서만 찾을 수 있다.
  // - 내 기록의 photo_path: owner_id가 빈 파일(시드 데이터, service role로 옮긴 파일 →
  //   ERD.md "Storage")은 위 목록에서 빠지는데, 그 파일도 지워져야 "탈퇴 시 즉시 전체 삭제"가 선다.
  const [{ data: uploaded, error: uploadedError }, { data: entries, error: entriesError }] =
    await Promise.all([
      admin.rpc("entry_photo_paths", { target: user.id }),
      admin.from("cloud_entries").select("photo_path").eq("user_id", user.id),
    ]);
  if (uploadedError || entriesError) {
    // 사진을 남긴 채 계정만 지우면 되돌릴 수 없어서 여기서 멈춘다.
    console.error(
      "account: 사진 경로 조회 실패",
      user.id,
      uploadedError ?? entriesError,
      uploadedError ? "rpc entry_photo_paths" : "select cloud_entries.photo_path",
    );
    return NextResponse.json(
      { error: "사진 목록을 불러오지 못해 탈퇴를 중단했어요. 잠시 후 다시 시도해주세요" },
      { status: 500 },
    );
  }
  const paths = [...new Set([...(uploaded ?? []), ...(entries ?? []).map((e) => e.photo_path)])];
  if (paths.length > 0) {
    await admin.storage.from(BUCKET).remove(paths);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "탈퇴 처리에 실패했어요" }, { status: 500 });

  return new NextResponse(null, { status: 204 });
};
