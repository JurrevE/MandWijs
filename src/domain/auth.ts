import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Vul een geldig e-mailadres in.")),
  password: z.string().min(8, "Gebruik minimaal 8 tekens."),
});

type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

const isRateLimitError = (error: AuthErrorLike) =>
  error.status === 429
  || error.code === "over_request_rate_limit"
  || error.code === "over_email_send_rate_limit"
  || error.message?.toLowerCase().includes("rate limit") === true;

export function loginErrorMessage(error: AuthErrorLike) {
  if (isRateLimitError(error)) {
    return "Te veel inlogpogingen. Wacht enkele minuten en probeer het daarna één keer opnieuw.";
  }

  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("invalid login credentials")) {
    return "E-mailadres of wachtwoord klopt niet. Gebruik ‘Wachtwoord vergeten?’ als je twijfelt.";
  }
  if (message.includes("email not confirmed")) {
    return "Bevestig eerst je e-mailadres via de link in je inbox.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Er kon geen verbinding met de inlogdienst worden gemaakt. Controleer je verbinding en probeer het opnieuw.";
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

export function signupErrorMessage(error: AuthErrorLike) {
  if (isRateLimitError(error)) {
    return "Er zijn te veel bevestigingsmails aangevraagd. Wacht even of probeer het later opnieuw.";
  }

  switch (error.code) {
    case "user_already_exists":
      return "Er bestaat al een account met dit e-mailadres. Probeer in te loggen.";
    case "weak_password":
      return "Kies een sterker wachtwoord van minimaal 8 tekens.";
    case "email_address_invalid":
      return "Dit e-mailadres kan niet worden gebruikt.";
    default:
      return "Het account kon tijdelijk niet worden aangemaakt. Probeer het later opnieuw.";
  }
}
