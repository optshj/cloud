import { createClient } from "@/shared/lib/supabase/client";

export const signInWithKakao = () => {
  const supabase = createClient();
  supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
};
