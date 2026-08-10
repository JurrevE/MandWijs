import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-2 text-[1.85rem] font-black leading-[1.05] tracking-[-.045em] text-mandwijs-deep sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-5 text-mandwijs-muted sm:text-base sm:leading-6">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
