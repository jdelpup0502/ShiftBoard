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
    "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base md:text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-black uppercase tracking-wide mb-1.5">
          Email
        </label>
        <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-black uppercase tracking-wide mb-1.5">
          Password
        </label>
        <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
