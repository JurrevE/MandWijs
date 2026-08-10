import { expect, test } from "@playwright/test";

for (const route of ["/login", "/register"]) {
  test(`wachtwoord tonen en verbergen op ${route}`, async ({ page }) => {
    await page.goto(route);
    const password = page.getByLabel("Wachtwoord", { exact: true });
    await password.fill("veilig-wachtwoord");

    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Wachtwoord tonen" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("veilig-wachtwoord");

    await page.getByRole("button", { name: "Wachtwoord verbergen" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });
}
