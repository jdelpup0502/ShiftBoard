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
    <div className="space-y-3">
      {DAYS.map(({ label, dow }) => {
        const { available, note } = days[dow];
        return (
          <div
            key={dow}
            className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
              available
                ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-4 min-w-[180px]">
              <button
                onClick={() => toggle(dow)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  available ? "bg-emerald-500" : "bg-red-400"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    available ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 w-24">{label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  available
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                }`}
              >
                {available ? "Available" : "Unavailable"}
              </span>
            </div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(dow, e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        );
      })}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-indigo-600 text-white rounded-lg px-6 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {pending ? "Saving…" : "Save Availability"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckIcon className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}
