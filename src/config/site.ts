export const siteConfig = {
  name: "MandWijs",
  description:
    "Jouw persoonlijke boodschappen, slim verdeeld over de voordeligste winkels.",
  defaultRadiusKm: 5,
  radiusOptionsKm: [1, 2, 5, 10, 25] as const,
  storePenaltyCents: Number(process.env.SHOPPING_STORE_PENALTY_CENTS ?? 300),
  supportEmail: "hallo@mandwijs.app",
} as const;

export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
