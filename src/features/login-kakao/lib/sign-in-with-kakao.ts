import { createClient } from "@/shared/lib/supabase/client";

export function signInWithKakao() {
  const supabase = createClient();
  supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}
