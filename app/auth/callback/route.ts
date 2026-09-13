import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

export const GET = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth/callback: 코드 교환 실패", error);
      return NextResponse.redirect(new URL("/?authError=1", request.url));
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
};
