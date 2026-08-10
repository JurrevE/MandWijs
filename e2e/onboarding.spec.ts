import { expect, test } from "@playwright/test";

test("registratie tot persoonlijk winkeladvies", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Naam").fill("Sanne Test");
  await page.getByLabel("E-mailadres").fill("sanne@example.nl");
  await page.getByLabel("Wachtwoord").fill("veilig-wachtwoord");
  await page.getByRole("button", { name: "Account maken" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Jouw naam").fill("Sanne Test");
  await page.getByRole("button", { name: "Verder" }).click();

  await page.getByLabel("Plaats, postcode of adres").fill("Utrecht Centrum");
  await page.getByRole("button", { name: "5 km", exact: true }).click();
  await page.getByRole("button", { name: "Verder" }).click();

  await expect(page.getByText("Albert Heijn")).toBeVisible();
  await expect(page.getByText("Lidl")).toBeVisible();
  await page.getByRole("button", { name: "Verder" }).click();

  await page.getByLabel("Eerste product").fill("Kip en skyr");
  await page.getByRole("button", { name: /Korte samenvatting/ }).click();
  await page.getByRole("button", { name: "Naar mijn overzicht" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Goedemiddag, Sanne Test/ })).toBeVisible();
  await expect(page.getByText("Beste balans voor jouw week")).toBeVisible();

  await page.getByRole("link", { name: /Boodschappenlijst/ }).first().click();
  await expect(page.getByRole("heading", { name: "Boodschappenlijst" })).toBeVisible();
  await expect(page.getByText("Geschat totaal")).toBeVisible();

  await page.goto("/aanbiedingen");
  await expect(page.getByRole("heading", { name: "Aanbiedingen & prijzen" })).toBeVisible();
  await expect(page.getByText("Skyr", { exact: false }).first()).toBeVisible();
});
