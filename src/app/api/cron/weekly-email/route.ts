import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { runWeeklyEmailJob } from "@/lib/email/weekly-email-job";
import { ResendEmailClient } from "@/lib/email/resend-client";
import type { Database } from "@/lib/supabase/database.types";
import { getSupermarketDataProvider } from "@/providers";
import { OpenStreetMapLocationProvider } from "@/providers/openstreetmap-location-provider";

const querySchema = z.object({
  dryRun: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  userId: z.uuid().optional(),
});

async function handler(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }
  const parsedQuery = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsedQuery.success) return Response.json({ error: "Ongeldige cronparameters." }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!supabaseUrl || !serviceKey || !appUrl) {
    return Response.json({ error: "Supabase service role of de publieke app-URL is niet geconfigureerd." }, { status: 503 });
  }

  const emailSender = new ResendEmailClient();
  if (!parsedQuery.data.dryRun && !emailSender.isConfigured()) {
    return Response.json({ error: "Resend is niet geconfigureerd." }, { status: 503 });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const result = await runWeeklyEmailJob({
      supabase,
      provider: getSupermarketDataProvider(),
      locationProvider: new OpenStreetMapLocationProvider(),
      emailSender: parsedQuery.data.dryRun ? undefined : emailSender,
      appUrl,
      dryRun: parsedQuery.data.dryRun,
      userId: parsedQuery.data.userId,
      storePenaltyCents: z.coerce.number().int().nonnegative().catch(300).parse(process.env.SHOPPING_STORE_PENALTY_CENTS),
    });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "De maandagmailtaak is mislukt." }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
