import { z } from "zod";
import { hasAppSession } from "@/lib/auth/app-session";
import { OpenStreetMapLocationProvider } from "@/providers/openstreetmap-location-provider";

const requestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  radiusKm: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10), z.literal(25)]),
});

export async function POST(request: Request) {
  if (!await hasAppSession()) return Response.json({ error: "Niet ingelogd." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ongeldige locatie of zoekstraal." }, { status: 400 });

  try {
    const result = await new OpenStreetMapLocationProvider().findNearbyStores(parsed.data);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Winkels zoeken is mislukt." }, { status: 502 });
  }
}
