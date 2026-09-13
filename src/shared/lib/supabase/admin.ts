import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// RLS 우회(service role). Route Handler에서만 import — 클라이언트에서 쓰면 키가 번들에 샌다.
export const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
};
