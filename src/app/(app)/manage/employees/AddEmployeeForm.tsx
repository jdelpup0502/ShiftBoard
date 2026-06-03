"use client";

import { createEmployee } from "@/app/actions/employees";
import { useState, useTransition, useRef } from "react";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function AddEmployeeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEmployee(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  const inputClass =
    "w-full border border-line rounded-md px-3 py-2.5 md:py-2 text-base md:text-sm text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors placeholder:text-ink-faint";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-accent text-accent-fg text-[12px] font-semibold uppercase tracking-[0.1em] px-4 py-2.5 rounded-md hover:bg-[var(--accent-hover)] transition-colors"
      >
        <UserPlusIcon className="w-4 h-4" />
        Add employee
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-surface rounded-xl shadow-[0_24px_48px_-12px_oklch(0_0_0/0.25)] w-full max-w-sm mx-4 p-6 border border-line">
            <div className="flex items-center justify-between mb-6">
              <h2 className="display text-[24px] text-ink leading-none">New employee</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-faint hover:text-ink transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
                  Full name
                </label>
                <input name="name" type="text" required placeholder="Jane Smith" className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
                  Email
                </label>
                <input name="email" type="email" required placeholder="jane@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">
                  Temporary password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Min 12 chars, include a number"
                  className={inputClass}
                />
                <p className="text-[11px] text-ink-faint mt-1.5">Share this with the employee so they can sign in.</p>
              </div>

              {error && (
                <p className="text-[13px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-line text-ink-soft text-[13px] font-semibold uppercase tracking-[0.1em] py-2.5 rounded-md hover:bg-sunken transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-accent text-accent-fg text-[13px] font-semibold uppercase tracking-[0.1em] py-2.5 rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
