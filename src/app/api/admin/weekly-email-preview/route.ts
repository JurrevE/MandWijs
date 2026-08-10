import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { runWeeklyEmailJob } from "@/lib/email/weekly-email-job";
import { getSupermarketDataProvider } from "@/providers";
import { OpenStreetMapLocationProvider } from "@/providers/openstreetmap-location-provider";

export async function POST() {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) return Response.json({ error: "Supabase is niet geconfigureerd." }, { status: 503 });
  const { data: authData } = await sessionClient.auth.getUser();
  if (!authData.user) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  const { data: profile } = await sessionClient.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profile?.role !== "admin") return Response.json({ error: "Geen beheerrechten." }, { status: 403 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!supabaseUrl || !serviceKey || !appUrl) return Response.json({ error: "De weekmailomgeving is niet volledig geconfigureerd." }, { status: 503 });

  const adminClient = createClient<Database>(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const result = await runWeeklyEmailJob({
      supabase: adminClient,
      provider: getSupermarketDataProvider(),
      locationProvider: new OpenStreetMapLocationProvider(),
      appUrl,
      dryRun: true,
      userId: authData.user.id,
    });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Weekmail-preview is mislukt." }, { status: 500 });
  }
}
