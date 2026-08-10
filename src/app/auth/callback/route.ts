import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const safeNextPath = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard");

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const callbackError = url.searchParams.get("error_description");
  if (callbackError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(callbackError)}`, url.origin));
  }
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = supabase ? await supabase.auth.exchangeCodeForSession(code) : { error: new Error("Supabase ontbreekt") };
    if (error) {
      return NextResponse.redirect(new URL("/login?error=De%20bevestigingslink%20is%20ongeldig%20of%20verlopen.", url.origin));
    }
  }
  const response = NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
  if (code) response.cookies.delete("mandwijs_demo_session");
  return response;
}
