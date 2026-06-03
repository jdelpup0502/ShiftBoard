"use client";

import { useActionState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
  submitLabel: string;
}

export default function AuthForm({ action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null
  );

  const inputClass =
    "w-full border border-line rounded-md px-3 py-2.5 text-base md:text-sm text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors placeholder:text-ink-faint";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.16em] mb-2">
          Email
        </label>
        <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.16em] mb-2">
          Password
        </label>
        <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      {state?.error && (
        <div className="flex items-center gap-2 text-[13px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2.5">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-accent text-accent-fg rounded-md py-2.5 mt-2 text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:opacity-50 transition-colors"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
