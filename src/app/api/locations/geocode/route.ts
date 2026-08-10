import { z } from "zod";
import { hasAppSession } from "@/lib/auth/app-session";
import { OpenStreetMapLocationProvider } from "@/providers/openstreetmap-location-provider";

const requestSchema = z.object({ query: z.string().trim().min(2).max(255) });

export async function POST(request: Request) {
  if (!await hasAppSession()) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Vul een geldig Nederlands adres of postcode in." }, { status: 400 });

  try {
    const location = await new OpenStreetMapLocationProvider().geocode(parsed.data.query);
    if (!location) return Response.json({ error: "Deze locatie is niet gevonden in Nederland." }, { status: 404 });
    return Response.json(location, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Locatie zoeken is mislukt." }, { status: 502 });
  }
}
