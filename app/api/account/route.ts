import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";

const BUCKET = "entry-photos";

// 탈퇴 즉시 전체 삭제: 사진 → auth 계정 순. DB 행은 auth.users FK cascade로 지워진다.
export const DELETE = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const admin = createAdminClient();

  // 경로에 uid가 없어 두 목록을 합친다: 업로더 기준(기록 안 한 사진) + 내 기록(owner_id 없는 파일).
  const [{ data: uploaded, error: uploadedError }, { data: entries, error: entriesError }] =
    await Promise.all([
      admin.rpc("entry_photo_paths", { target: user.id }),
      admin.from("cloud_entries").select("photo_path").eq("user_id", user.id),
    ]);
  if (uploadedError || entriesError) {
    // 사진을 남긴 채 계정만 지우면 되돌릴 수 없다.
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
    // remove()는 throw하지 않고 { error }를 돌려준다. 여기서 중단할지는 아직 미정.
    const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);
    if (removeError) {
      console.error("account: 사진 파일 삭제 실패", user.id, paths.length, removeError);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account: auth 계정 삭제 실패", user.id, error);
    return NextResponse.json({ error: "탈퇴 처리에 실패했어요" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
};
