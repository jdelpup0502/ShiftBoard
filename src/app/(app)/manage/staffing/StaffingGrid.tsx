"use client";

import { upsertRequirement } from "@/app/actions/staffing";
import { useState, useTransition } from "react";
import type { JobTitle } from "@prisma/client";
import { CheckIcon } from "@heroicons/react/24/outline";

const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const ROLE_DOT: Record<JobTitle, string> = {
  SERVER: "bg-sky-500",
  HOST: "bg-emerald-500",
  BUSSER: "bg-amber-500",
  BARTENDER: "bg-violet-500",
};

const ROLE_INK: Record<JobTitle, string> = {
  SERVER: "text-sky-700 dark:text-sky-300",
  HOST: "text-emerald-700 dark:text-emerald-300",
  BUSSER: "text-amber-700 dark:text-amber-400",
  BARTENDER: "text-violet-700 dark:text-violet-300",
};

interface Day {
  label: string;
  dow: number;
}

interface Props {
  days: Day[];
  jobTitles: JobTitle[];
  initialGrid: Record<string, number>;
}

export default function StaffingGrid({ days, jobTitles, initialGrid }: Props) {
  const [grid, setGrid] = useState<Record<string, number>>(initialGrid);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(dow: number, role: JobTitle, value: string) {
    const count = Math.max(0, parseInt(value) || 0);
    setGrid((prev) => ({ ...prev, [`${dow}-${role}`]: count }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      for (const { dow } of days) {
        for (const role of jobTitles) {
          await upsertRequirement(dow, role, grid[`${dow}-${role}`] ?? 0);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const inputClass =
    "w-full text-center border border-line rounded-md px-2 py-2.5 md:py-1.5 text-base md:text-sm bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors font-mono tnum font-semibold text-ink";

  return (
    <div>
      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted bg-sunken w-36">
                Role
              </th>
              {days.map((d) => (
                <th key={d.dow} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted bg-sunken min-w-[72px]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobTitles.map((role, ri) => (
              <tr key={role} className={ri < jobTitles.length - 1 ? "border-b border-line-soft" : ""}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ROLE_DOT[role]}`} />
                    <span className={`text-[13px] font-semibold ${ROLE_INK[role]}`}>{JOB_LABEL[role]}</span>
                  </div>
                </td>
                {days.map(({ dow }) => (
                  <td key={dow} className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={grid[`${dow}-${role}`] ?? 0}
                      onChange={(e) => handleChange(dow, role, e.target.value)}
                      className="w-14 text-center border border-line rounded-md px-2 py-1.5 text-sm bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors font-mono tnum font-semibold text-ink"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: per-role cards */}
      <div className="md:hidden space-y-3">
        {jobTitles.map((role) => (
          <div key={role} className="rounded-xl border border-line bg-surface overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-line-soft flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ROLE_DOT[role]}`} />
              <span className={`text-[13px] font-semibold ${ROLE_INK[role]}`}>{JOB_LABEL[role]}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {days.map(({ dow, label }) => (
                <label key={dow} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    {label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={grid[`${dow}-${role}`] ?? 0}
                    onChange={(e) => handleChange(dow, role, e.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="w-full sm:w-auto bg-accent text-accent-fg rounded-md px-5 py-2.5 sm:py-2 text-[13px] font-semibold uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save requirements"}
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
