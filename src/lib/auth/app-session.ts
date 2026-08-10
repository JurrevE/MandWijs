import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function hasAppSession() {
  const cookieStore = await cookies();
  if (cookieStore.has("mandwijs_demo_session")) return true;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}
