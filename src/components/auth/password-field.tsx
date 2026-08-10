"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  enterKeyHint?: "go" | "next";
};

export function PasswordField({ autoComplete, enterKeyHint = "go" }: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? "Wachtwoord verbergen" : "Wachtwoord tonen";

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-bold">Wachtwoord</label>
      <span className="relative mt-2 block">
        <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" />
        <input
          id={inputId}
          required
          name="password"
          type={visible ? "text" : "password"}
          minLength={8}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          className="input-field input-field-with-icon input-field-with-action"
          placeholder="Minimaal 8 tekens"
        />
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={visible}
          title={toggleLabel}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-mandwijs-muted transition-colors hover:bg-[#edf4f1] hover:text-mandwijs-deep"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
        </button>
      </span>
    </div>
  );
}
