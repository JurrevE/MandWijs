import type { PersistedState } from "@/domain/app-state";

export function LocationAttribution({ source, className = "" }: { source: PersistedState["storeDataSource"]; className?: string }) {
  if (source !== "openstreetmap") return null;
  return (
    <a
      href="https://www.openstreetmap.org/copyright"
      target="_blank"
      rel="noreferrer"
      className={`font-bold underline decoration-current/35 underline-offset-2 hover:decoration-current ${className}`}
    >
      Winkellocaties © OpenStreetMap contributors (ODbL)
    </a>
  );
}
