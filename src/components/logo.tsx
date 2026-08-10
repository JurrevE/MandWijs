import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-black tracking-[-0.03em]", className)}>
      <span className="relative grid size-9 place-items-center rounded-[0.7rem] bg-kopert-deep text-white shadow-sm">
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-kopert-accent" />
        K
      </span>
      <span className="text-[1.15rem]">{siteConfig.name}</span>
    </Link>
  );
}
