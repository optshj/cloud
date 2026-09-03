import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// 라우트 핸들러/서버 컴포넌트 전용 — 매 요청마다 새로 만들어야 함(공유 금지).
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
            // Server Component에서 호출된 경우 쿠키를 쓸 수 없음 — proxy.ts가 세션 갱신을 대신 처리한다.
          }
        },
      },
    },
  );
};
