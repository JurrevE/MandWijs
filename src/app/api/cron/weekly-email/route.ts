import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { renderWeeklyEmail } from "@/emails/weekly-email";
import { weeklyEmailKey } from "@/domain/email";
import type { ShoppingPlan } from "@/domain/types";

const isoWeek = (date = new Date()) => {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return `${target.getUTCFullYear()}-W${String(Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`;
};

async function handler(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !serviceKey || !resendKey) return NextResponse.json({ error: "Supabase service role of Resend is niet geconfigureerd" }, { status: 503 });

  // De echte optimizerinput komt uit de database. Zonder live brondata wordt bewust niets verzonden.
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profiles, error } = await supabase.from("profiles").select("id, display_name, email_preference").neq("email_preference", "none");
  if (error) return NextResponse.json({ error: "Profielen konden niet worden gelezen" }, { status: 500 });
  let sent = 0;
  let skipped = 0;
  const week = isoWeek();

  for (const profile of profiles ?? []) {
    const key = weeklyEmailKey(profile.id, week);
    const { data: existing } = await supabase.from("weekly_email_deliveries").select("id").eq("idempotency_key", key).maybeSingle();
    if (existing) { skipped += 1; continue; }
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    if (!authUser.user?.email) { skipped += 1; continue; }
    const emptyPlan: ShoppingPlan = { id: "balance", label: "Beste balans", description: "", totalCents: 0, scoreCents: 0, storeCount: 0, savingsCents: 0, options: [], unmatchedProductIds: [] };
    const email = renderWeeklyEmail({ name: profile.display_name ?? "daar", preference: profile.email_preference, plan: emptyPlan, validFrom: "deze week", validUntil: "zondag", dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/instellingen` });
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: authUser.user.email, subject: email.subject, html: email.html }) });
    if (!response.ok) continue;
    await supabase.from("weekly_email_deliveries").insert({ user_id: profile.id, week_key: week, idempotency_key: key, sent_at: new Date().toISOString() });
    sent += 1;
  }
  return NextResponse.json({ sent, skipped, week });
}

export const GET = handler;
export const POST = handler;
