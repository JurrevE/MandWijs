"use client";

import { Chrome, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function startGoogleLogin() {
    if (pending) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Google-inloggen is nog niet geconfigureerd.");
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/onboarding");
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        console.warn("Supabase Google-login geweigerd", { code: oauthError?.code, status: oauthError?.status });
        setError(oauthError?.code === "provider_disabled"
          ? "Google-inloggen staat nog niet aan in Supabase."
          : "Google-inloggen kon niet worden gestart. Probeer het opnieuw.");
        setPending(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Google-inloggen kon niet worden gestart. Controleer je verbinding en probeer het opnieuw.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        aria-disabled={pending}
        onClick={startGoogleLogin}
        className="min-h-13 w-full text-base"
      >
        {pending ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <Chrome aria-hidden="true" className="size-5" />}
        {pending ? "Google openen..." : "Doorgaan met Google"}
      </Button>
      {error && <p role="alert" aria-live="polite" className="mt-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-sm font-semibold text-[#93343c]">{error}</p>}
    </div>
  );
}
