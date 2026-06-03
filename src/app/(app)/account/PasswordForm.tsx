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
    "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base md:text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
          Current Password
        </label>
        <input name="current" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
          New Password
        </label>
        <input name="next" type="password" required placeholder="Min 6 characters" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
          Confirm New Password
        </label>
        <input name="confirm" type="password" required placeholder="••••••••" className={inputClass} />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          Password changed successfully.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto bg-indigo-600 text-white rounded-lg px-5 py-2.5 sm:py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {pending ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
