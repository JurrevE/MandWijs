import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const styles = {
  neutral: "bg-[#edf2f0] text-[#46524e]",
  success: "bg-[#e1f5ed] text-[#205f4c]",
  deal: "bg-[#d9f5ea] text-[#145f47]",
  warning: "bg-[#fff0df] text-[#985012]",
  danger: "bg-[#ffe9eb] text-[#99333b]",
  dark: "bg-kopert-deep text-white",
} as const;

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold leading-none",
        styles[tone],
        className,
      )}
      {...props}
    />
  );
}
