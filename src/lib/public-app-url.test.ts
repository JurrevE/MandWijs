import { describe, expect, it } from "vitest";
import { resolvePublicAppUrl } from "./public-app-url";

describe("publieke app-URL", () => {
  it("gebruikt de expliciete app-URL en verwijdert een afsluitende slash", () => {
    expect(resolvePublicAppUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://mandwijs.com/",
    })).toBe("https://mandwijs.com");
  });

  it("valt in productie nooit terug op localhost", () => {
    expect(resolvePublicAppUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      VERCEL_PROJECT_PRODUCTION_URL: "mandwijs.com",
    })).toBe("https://mandwijs.com");
  });

  it("weigert productie zonder een publieke URL", () => {
    expect(() => resolvePublicAppUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    })).toThrow("publieke productie-URL");
  });

  it("gebruikt localhost alleen tijdens lokale ontwikkeling", () => {
    expect(resolvePublicAppUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
  });
});
