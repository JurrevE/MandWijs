"use client";

import { Chrome, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  kind?: "primary" | "google";
};

export function AuthSubmitButton({ label, pendingLabel, kind = "primary" }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={kind === "google" ? "secondary" : "primary"}
      disabled={pending}
      aria-disabled={pending}
      className="min-h-13 w-full text-base"
    >
      {pending ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : kind === "google" ? <Chrome aria-hidden="true" className="size-5" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}

