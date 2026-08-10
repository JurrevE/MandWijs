"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in."),
  password: z.string().min(8, "Gebruik minimaal 8 tekens."),
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const messageUrl = (path: string, type: "error" | "message", message: string) =>
  `${path}?${type}=${encodeURIComponent(message)}`;

async function setDemoSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set("mandwijs_demo_session", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete("mandwijs_demo_session");
}

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("/login", "error", parsed.error.issues[0].message));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    await setDemoSession(parsed.data.email);
    redirect("/dashboard");
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(messageUrl("/login", "error", "E-mailadres of wachtwoord klopt niet."));
  await clearDemoSession();
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const parsed = credentialsSchema.extend({ name: z.string().min(2, "Vul je naam in.") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("/register", "error", parsed.error.issues[0].message));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    await setDemoSession(parsed.data.email);
    redirect("/onboarding");
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
      data: { name: parsed.data.name },
    },
  });
  if (error) redirect(messageUrl("/register", "error", error.message));
  await clearDemoSession();
  if (data.session) redirect("/onboarding");
  redirect(messageUrl("/login", "message", "Controleer je inbox om je account te bevestigen."));
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = z.object({ email: z.email() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("/forgot-password", "error", "Vul een geldig e-mailadres in."));
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${appUrl}/auth/callback?next=/update-password` });
  }
  redirect(messageUrl("/forgot-password", "message", "Als het account bestaat, ontvang je zo een e-mail."));
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = z.object({
    password: z.string().min(8, "Gebruik minimaal 8 tekens."),
    confirmation: z.string(),
  }).refine((value) => value.password === value.confirmation, {
    message: "De wachtwoorden komen niet overeen.",
    path: ["confirmation"],
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("/update-password", "error", parsed.error.issues[0].message));

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(messageUrl("/update-password", "error", "Supabase is niet geconfigureerd."));
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(messageUrl("/update-password", "error", "Het wachtwoord kon niet worden gewijzigd. Vraag een nieuwe link aan."));
  redirect(messageUrl("/login", "message", "Je wachtwoord is gewijzigd. Je kunt nu inloggen."));
}

export async function googleLoginAction() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    await setDemoSession("demo@mandwijs.app");
    redirect("/dashboard");
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${appUrl}/auth/callback?next=/dashboard` },
  });
  if (error || !data.url) redirect(messageUrl("/login", "error", "Google-inloggen kon niet worden gestart."));
  await clearDemoSession();
  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  await clearDemoSession();
  redirect("/");
}
