"use client";

import { useState, useTransition } from "react";
import { upsertAvailability } from "@/app/actions/availability";
import { CheckIcon } from "@heroicons/react/24/outline";

const DAYS = [
  { label: "Tuesday", dow: 2 },
  { label: "Wednesday", dow: 3 },
  { label: "Thursday", dow: 4 },
  { label: "Friday", dow: 5 },
  { label: "Saturday", dow: 6 },
  { label: "Sunday", dow: 0 },
];

interface DayState {
  available: boolean;
  note: string;
}

interface Props {
  weekStartISO: string;
  initial: Record<number, { available: boolean; note: string | null }>;
}

export default function AvailabilityGrid({ weekStartISO, initial }: Props) {
  const [days, setDays] = useState<Record<number, DayState>>(() =>
    Object.fromEntries(
      DAYS.map(({ dow }) => [
        dow,
        { available: initial[dow]?.available ?? true, note: initial[dow]?.note ?? "" },
      ])
    )
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(dow: number) {
    setDays((prev) => ({ ...prev, [dow]: { ...prev[dow], available: !prev[dow].available } }));
    setSaved(false);
  }

  function setNote(dow: number, note: string) {
    setDays((prev) => ({ ...prev, [dow]: { ...prev[dow], note } }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      for (const { dow } of DAYS) {
        await upsertAvailability(dow, days[dow].available, days[dow].note, weekStartISO);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      <div className="divide-y divide-line-soft border border-line rounded-xl bg-surface overflow-hidden">
        {DAYS.map(({ label, dow }) => {
          const { available, note } = days[dow];
          return (
            <div
              key={dow}
              className={`px-4 py-3.5 md:px-5 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                available ? "" : "bg-red-50/40 dark:bg-red-950/15"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 sm:min-w-[200px]">
                <button
                  type="button"
                  onClick={() => toggle(dow)}
                  aria-label={available ? `${label} available, tap to mark unavailable` : `${label} unavailable, tap to mark available`}
                  className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                    available ? "bg-emerald-500" : "bg-red-400"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      available ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="font-semibold text-[14px] text-ink flex-1 sm:flex-none sm:w-24">{label}</span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm shrink-0 ${
                    available
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                  }`}
                >
                  {available ? "On" : "Off"}
                </span>
              </div>
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(dow, e.target.value)}
                className="w-full sm:flex-1 border border-line rounded-md px-3 py-2.5 md:py-2 text-base md:text-sm text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-edge placeholder:text-ink-faint"
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-5">
        <button
          onClick={handleSave}
          disabled={pending}
          className="w-full sm:w-auto bg-accent text-accent-fg rounded-md px-6 py-2.5 sm:py-2 text-[13px] font-semibold uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save availability"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckIcon className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
