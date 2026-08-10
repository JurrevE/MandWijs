import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-mandwijs-deep text-white shadow-[0_8px_25px_rgba(23,61,50,.18)] hover:bg-[#204f42]",
  secondary: "border border-mandwijs-line bg-white text-mandwijs-text hover:bg-[#f1f7f4]",
  soft: "bg-[#e9f5f0] text-mandwijs-deep hover:bg-[#dcefe7]",
  ghost: "text-mandwijs-muted hover:bg-[#edf4f1] hover:text-mandwijs-text",
  danger: "bg-[#fff0f1] text-[#9f3039] hover:bg-[#ffe5e7]",
} as const;

type Variant = keyof typeof variants;

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
