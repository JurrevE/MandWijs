import type { PersonalProduct, ProductMatch, ProviderProduct } from "./types";

const normalize = (value: string | undefined) =>
  (value ?? "")
    .toLocaleLowerCase("nl-NL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasAllWords = (needle: string, haystack: string) =>
  normalize(needle)
    .split(" ")
    .filter(Boolean)
    .every((word) => normalize(haystack).includes(word));

export interface MatchInput {
  personalProduct: PersonalProduct;
  providerProduct: ProviderProduct;
  expectedEan?: string;
  expectedSourceProductId?: string;
  now?: string;
}

export function matchProduct(input: MatchInput): ProductMatch {
  const { personalProduct: own, providerProduct: candidate } = input;
  const base = {
    userProductId: own.id,
    providerProductId: candidate.id,
    source: "provider",
    updatedAt: input.now ?? new Date().toISOString(),
  };

  if (input.expectedEan && candidate.ean === input.expectedEan) {
    return { ...base, matchType: "exact", confidence: 1, reason: "Exacte EAN-match" };
  }

  if (input.expectedSourceProductId && candidate.sourceProductId === input.expectedSourceProductId) {
    return { ...base, matchType: "exact", confidence: 0.99, reason: "Exact bronproduct-ID" };
  }

  const brandMatches = !own.preferredBrand || normalize(candidate.brand) === normalize(own.preferredBrand);
  const amountMatches =
    !candidate.packageQuantity ||
    (candidate.packageQuantity === own.quantity && candidate.packageUnit === own.unit);
  const nameMatches = hasAllWords(own.searchTerm || own.name, candidate.name);

  if (own.kind === "exact" && brandMatches && nameMatches && amountMatches && !candidate.isHouseBrand) {
    return { ...base, matchType: "exact", confidence: 0.92, reason: "Merk, naam en hoeveelheid komen overeen" };
  }

  const categoryMatches = normalize(candidate.category) === normalize(own.category) || hasAllWords(own.searchTerm, candidate.name);
  if (categoryMatches && candidate.isHouseBrand && own.allowHouseBrand) {
    return { ...base, matchType: "house_brand", confidence: 0.72, reason: "Toegestaan huismerk-alternatief binnen dezelfde categorie" };
  }

  if (categoryMatches && own.kind === "category") {
    return { ...base, matchType: "comparable", confidence: 0.78, reason: "Vergelijkbaar product binnen de gevraagde categorie" };
  }

  return {
    ...base,
    providerProductId: undefined,
    matchType: "none",
    confidence: 0,
    reason: "Geen betrouwbare overeenkomst gevonden",
  };
}
