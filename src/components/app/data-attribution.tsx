import type { PersistedState } from "@/domain/app-state";

export function DataAttribution({ source, className = "" }: { source: PersistedState["dataSource"]; className?: string }) {
  if (source !== "live") return null;
  return (
    <a
      href="https://www.prijsprofeet.nl"
      target="_blank"
      rel="noreferrer"
      className={`font-bold underline decoration-current/35 underline-offset-2 hover:decoration-current ${className}`}
    >
      Bron: PrijsProfeet
    </a>
  );
}
