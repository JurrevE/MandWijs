type PublicAppUrlEnvironment = {
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
  NODE_ENV?: string;
};

const normalizeUrl = (value?: string) => {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};

const isLocalUrl = (value: string) => {
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

export function resolvePublicAppUrl(environment: PublicAppUrlEnvironment = process.env) {
  const production = environment.NODE_ENV === "production";
  const candidates = [
    environment.NEXT_PUBLIC_APP_URL,
    environment.VERCEL_PROJECT_PRODUCTION_URL,
    environment.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate);
    if (url && (!production || !isLocalUrl(url))) return url;
  }

  if (production) {
    throw new Error("Er is geen geldige publieke productie-URL geconfigureerd.");
  }

  return "http://localhost:3000";
}
