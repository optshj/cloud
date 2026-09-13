import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// 요청마다 새로 만든다(공유 금지).
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에선 쓸 수 없다 — proxy.ts가 세션을 갱신한다.
          }
        },
      },
    },
  );
};
