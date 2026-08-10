"use client";

import Link from "next/link";
import { LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAction } from "@/app/auth/actions";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { loginErrorMessage } from "@/domain/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [clientError, setClientError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    event.preventDefault();
    setPending(true);
    setClientError(undefined);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        console.warn("Supabase client-login geweigerd", { code: result.error.code, status: result.error.status, message: result.error.message });
        setClientError(loginErrorMessage(result.error));
        return;
      }

      if (!result.data.session || !result.data.user) {
        setClientError("Inloggen lukte, maar de sessie ontbreekt. Probeer het opnieuw.");
        return;
      }

      const { data: verified, error: verificationError } = await supabase.auth.getUser();
      if (verificationError || !verified.user || verified.user.id !== result.data.user.id) {
        await supabase.auth.signOut({ scope: "local" });
        setClientError("Inloggen lukte, maar de sessie kon niet worden bevestigd. Sta cookies toe en probeer het opnieuw.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setClientError("Er kon geen veilige verbinding met de inlogdienst worden gemaakt. Controleer je verbinding en probeer het opnieuw.");
    } finally {
      setPending(false);
    }
  }

  const error = clientError ?? initialError;

  return (
    <>
      {error && <p role="alert" aria-live="polite" className="mt-6 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-sm font-semibold text-[#93343c]">{error}</p>}
      <form action={loginAction} onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="block text-sm font-bold">E-mailadres<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input required name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" enterKeyHint="next" className="input-field input-field-with-icon" placeholder="jij@voorbeeld.nl" /></span></label>
        <PasswordField autoComplete="current-password" />
        <div className="text-right"><Link href="/forgot-password" className="text-sm font-bold text-mandwijs-deep hover:underline">Wachtwoord vergeten?</Link></div>
        <Button type="submit" disabled={pending} aria-disabled={pending} className="min-h-13 w-full text-base">
          {pending && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
          {pending ? "Bezig met inloggen..." : "Inloggen"}
        </Button>
      </form>
    </>
  );
}
