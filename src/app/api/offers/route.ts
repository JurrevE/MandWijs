import { cookies } from "next/headers";
import { z } from "zod";
import { syncOffersWithFallback } from "@/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  queries: z.array(z.string().trim().min(1).max(160)).max(25),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const hasDemoSession = cookieStore.has("mandwijs_demo_session");
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!hasDemoSession && !data.user) {
    return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Ongeldige zoekopdracht." }, { status: 400 });
  }

  const result = await syncOffersWithFallback(parsed.data.queries);
  return Response.json(result, {
    headers: { "Cache-Control": "private, max-age=0, no-store" },
  });
}
