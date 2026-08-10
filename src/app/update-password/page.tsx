import type { Metadata } from "next";
import { updatePasswordAction } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Nieuw wachtwoord" };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7faf8] px-5 py-12">
      <section className="surface-card w-full max-w-md p-6 sm:p-8">
        <Logo />
        <h1 className="mt-8 text-3xl font-black tracking-[-.045em] text-mandwijs-deep">Kies een nieuw wachtwoord</h1>
        <p className="mt-3 text-sm leading-6 text-mandwijs-muted">Gebruik minimaal acht tekens en bewaar je wachtwoord veilig.</p>
        {params.error && <p className="mt-5 rounded-xl bg-[#fff0f1] p-3 text-sm font-semibold text-[#963d45]">{params.error}</p>}
        <form action={updatePasswordAction} className="mt-7 space-y-4">
          <label className="block text-sm font-bold">Nieuw wachtwoord<input required name="password" type="password" minLength={8} autoComplete="new-password" className="input-field mt-2" /></label>
          <label className="block text-sm font-bold">Herhaal wachtwoord<input required name="confirmation" type="password" minLength={8} autoComplete="new-password" className="input-field mt-2" /></label>
          <Button type="submit" className="w-full">Wachtwoord opslaan</Button>
        </form>
      </section>
    </main>
  );
}
