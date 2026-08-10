import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const safeNextPath = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard");

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
}
