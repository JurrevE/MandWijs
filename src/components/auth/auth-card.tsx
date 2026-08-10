import Link from "next/link";
import { ArrowLeft, Mail, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { LoginForm } from "@/components/auth/login-form";
import { PasswordField } from "@/components/auth/password-field";
import { loginAction, requestPasswordResetAction, signupAction } from "@/app/auth/actions";

type Mode = "login" | "register" | "forgot";

const content = {
  login: { title: "Fijn je weer te zien", subtitle: "Log in om je persoonlijke weekadvies te bekijken.", submit: "Inloggen" },
  register: { title: "Begin met besparen", subtitle: "Maak in een minuut je persoonlijke MandWijs-account.", submit: "Account maken" },
  forgot: { title: "Wachtwoord vergeten?", subtitle: "We sturen je een veilige link om een nieuw wachtwoord te kiezen.", submit: "Stuur herstelmail" },
};

export function AuthCard({ mode, error, message }: { mode: Mode; error?: string; message?: string }) {
  const copy = content[mode];
  const action = mode === "login" ? loginAction : mode === "register" ? signupAction : requestPasswordResetAction;
  const pendingLabel = mode === "login" ? "Bezig met inloggen..." : mode === "register" ? "Account maken..." : "Herstelmail versturen...";

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(30rem,.8fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-md py-14">
          {mode === "forgot" && <Link href="/login" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-mandwijs-muted hover:text-mandwijs-text"><ArrowLeft className="size-4" /> Terug naar inloggen</Link>}
          <h1 className="text-3xl font-black tracking-[-.045em] text-mandwijs-deep sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 leading-7 text-mandwijs-muted">{copy.subtitle}</p>

          {mode !== "login" && error && <p role="alert" className="mt-6 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-sm font-semibold text-[#93343c]">{error}</p>}
          {message && <p className="mt-6 rounded-xl border border-[#c8e7da] bg-[#eaf7f1] px-4 py-3 text-sm font-semibold text-[#245f4e]">{message}</p>}

          {mode === "login" ? <LoginForm initialError={error} /> : <form action={action} className="mt-7 space-y-4">
            {mode === "register" && (
              <label className="block text-sm font-bold">Naam<span className="relative mt-2 block"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input required name="name" autoComplete="name" className="input-field input-field-with-icon" placeholder="Bijvoorbeeld Sanne" /></span></label>
            )}
            <label className="block text-sm font-bold">E-mailadres<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input required name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" enterKeyHint={mode === "forgot" ? "send" : "next"} className="input-field input-field-with-icon" placeholder="jij@voorbeeld.nl" /></span></label>
            {mode !== "forgot" && (
              <PasswordField autoComplete="new-password" />
            )}
            <AuthSubmitButton label={copy.submit} pendingLabel={pendingLabel} />
          </form>}

          {mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-mandwijs-muted before:h-px before:flex-1 before:bg-mandwijs-line after:h-px after:flex-1 after:bg-mandwijs-line">of</div>
              <GoogleLoginButton />
            </>
          )}
          <p className="mt-7 text-center text-sm text-mandwijs-muted">
            {mode === "login" ? <>Nog geen account? <Link href="/register" className="font-bold text-mandwijs-deep hover:underline">Gratis registreren</Link></> : mode === "register" ? <>Al een account? <Link href="/login" className="font-bold text-mandwijs-deep hover:underline">Inloggen</Link></> : "De link is 60 minuten geldig."}
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-mandwijs-deep p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border-[70px] border-white/5" />
        <p className="relative max-w-sm text-sm leading-6 text-white/60">Persoonlijk prijsadvies voor normale prijzen én aanbiedingen, zonder onduidelijke actievoorwaarden.</p>
        <blockquote className="relative max-w-lg"><p className="text-3xl font-black leading-tight tracking-[-.04em]">“Ik zie in één oogopslag of een extra winkel de besparing waard is.”</p><footer className="mt-6 text-sm text-white/60">Demo-ervaring · Utrecht</footer></blockquote>
      </aside>
    </main>
  );
}
