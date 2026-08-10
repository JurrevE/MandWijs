import { describe, expect, it } from "vitest";
import { credentialsSchema, loginErrorMessage } from "./auth";

describe("inloggegevens", () => {
  it("normaliseert een e-mailadres zonder het wachtwoord aan te passen", () => {
    expect(credentialsSchema.parse({
      email: "  Jurre@Voorbeeld.NL ",
      password: " wachtwoord ",
    })).toEqual({
      email: "jurre@voorbeeld.nl",
      password: " wachtwoord ",
    });
  });

  it("houdt een te kort wachtwoord tegen", () => {
    expect(credentialsSchema.safeParse({ email: "jurre@voorbeeld.nl", password: "kort" }).success).toBe(false);
  });
});

describe("inlogfouten", () => {
  it("maakt onderscheid tussen onjuiste gegevens en een onbevestigd account", () => {
    expect(loginErrorMessage({ code: "invalid_credentials", status: 400 })).toContain("wachtwoord");
    expect(loginErrorMessage({ code: "email_not_confirmed", status: 400 })).toContain("Bevestig");
  });

  it("herkent rate limiting op foutcode en status", () => {
    expect(loginErrorMessage({ code: "over_request_rate_limit", status: 400 })).toContain("Te veel");
    expect(loginErrorMessage({ status: 429 })).toContain("Te veel");
  });

  it("lekt geen onbekende providerfout naar de gebruiker", () => {
    expect(loginErrorMessage({ code: "unexpected_provider_failure", status: 500 })).toBe(
      "Inloggen lukt tijdelijk niet. Wacht even en probeer het daarna opnieuw.",
    );
  });
});

