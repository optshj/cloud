import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 서비스 롤 키로 RLS를 우회하는 클라이언트. 계정 탈퇴(다른 유저의 auth 계정/파일 삭제)처럼
// 본인 권한을 넘어서는 작업에만 쓴다. Route Handler(app/api/**)에서만 import할 것 —
// 'use client' 컴포넌트에서 import하면 서비스 롤 키가 브라우저 번들에 노출된다.
export const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
};
