import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

export const GET = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // 삼키면 "로그인 눌렀는데 로그인이 안 됨"만 남고 서버·클라이언트 어디에도 단서가 없다.
      console.error("auth/callback: 코드 교환 실패", error);
      return NextResponse.redirect(new URL("/?authError=1", request.url));
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
};
