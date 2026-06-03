"use client";

import { updatePassword } from "@/app/actions/account";
import { useState, useTransition, useRef } from "react";

export default function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  const inputClass =
    "w-full border border-line rounded-md px-3 py-2.5 text-base md:text-sm text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors";

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
          Current password
        </label>
        <input name="current" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
          New password
        </label>
        <input name="next" type="password" required placeholder="Min 12 characters" className={inputClass} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
          Confirm new password
        </label>
        <input name="confirm" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      {error && (
        <p className="text-[13px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-[13px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md px-3 py-2">
          Password changed.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto bg-accent text-accent-fg rounded-md px-5 py-2.5 sm:py-2 text-[13px] font-semibold uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
