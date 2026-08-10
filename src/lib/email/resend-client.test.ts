import { describe, expect, it, vi } from "vitest";
import { ResendEmailClient } from "./resend-client";

describe("ResendEmailClient", () => {
  it("verstuurt HTML, tekst en een idempotentiesleutel server-side", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer re_test");
      expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("weekly/user/week");
      expect(new Headers(init?.headers).get("User-Agent")).toContain("MandWijs");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        from: "MandWijs <week@mandwijs.nl>",
        to: ["jurre@example.com"],
        text: "Tekstversie",
      });
      return Response.json({ id: "email-123" });
    });
    const client = new ResendEmailClient({ apiKey: "re_test", from: "MandWijs <week@mandwijs.nl>", fetchImpl });

    await expect(client.send({
      to: "jurre@example.com",
      subject: "Weekadvies",
      html: "<p>Weekadvies</p>",
      text: "Tekstversie",
      idempotencyKey: "weekly/user/week",
    })).resolves.toEqual({ id: "email-123" });
  });

  it("geeft providerfouten zonder gevoelige response-inhoud door", async () => {
    const client = new ResendEmailClient({
      apiKey: "re_test",
      from: "MandWijs <week@mandwijs.nl>",
      fetchImpl: vi.fn(async () => new Response("gevoelige providerdetails", { status: 422 })),
    });

    await expect(client.send({
      to: "jurre@example.com",
      subject: "Weekadvies",
      html: "<p>Weekadvies</p>",
      text: "Tekstversie",
      idempotencyKey: "weekly/user/week",
    })).rejects.toThrow("Resend gaf HTTP 422");
  });
});
