import { z } from "zod";
import { syncOffersWithFallback } from "@/providers";
import { hasAppSession } from "@/lib/auth/app-session";

const requestSchema = z.object({
  queries: z.array(z.string().trim().min(1).max(160)).max(25),
});

export async function POST(request: Request) {
  if (!await hasAppSession()) {
    return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Ongeldige zoekopdracht." }, { status: 400 });
  }

  const result = await syncOffersWithFallback(parsed.data.queries);
  return Response.json(result, {
    headers: { "Cache-Control": "private, max-age=0, no-store" },
  });
}
