import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Vul een geldig e-mailadres in.")),
  password: z.string().min(8, "Gebruik minimaal 8 tekens."),
});

type AuthErrorLike = {
  code?: string;
  status?: number;
};

export function loginErrorMessage(error: AuthErrorLike) {
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Te veel inlogpogingen. Wacht enkele minuten en probeer het daarna één keer opnieuw.";
  }

  switch (error.code) {
    case "email_not_confirmed":
      return "Bevestig eerst je e-mailadres via de link in je inbox.";
    case "user_banned":
      return "Dit account is tijdelijk geblokkeerd. Neem contact op met MandWijs.";
    case "captcha_failed":
      return "De beveiligingscontrole is mislukt. Ververs de pagina en probeer het opnieuw.";
    case "invalid_credentials":
      return "E-mailadres of wachtwoord klopt niet. Gebruik ‘Wachtwoord vergeten?’ als je twijfelt.";
    default:
      return "Inloggen lukt tijdelijk niet. Wacht even en probeer het daarna opnieuw.";
  }
}

