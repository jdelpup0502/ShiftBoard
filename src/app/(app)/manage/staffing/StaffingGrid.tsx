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

const JOB_COLOR: Record<JobTitle, string> = {
  SERVER: "text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
  HOST: "text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
  BUSSER: "text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
  BARTENDER: "text-purple-800 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
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

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 w-32">
                Role
              </th>
              {days.map((d) => (
                <th key={d.dow} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 min-w-[72px]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobTitles.map((role, ri) => (
              <tr key={role} className={ri < jobTitles.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}>
                <td className={`px-4 py-3 font-semibold text-sm ${JOB_COLOR[role]}`}>
                  {JOB_LABEL[role]}
                </td>
                {days.map(({ dow }) => (
                  <td key={dow} className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={grid[`${dow}-${role}`] ?? 0}
                      onChange={(e) => handleChange(dow, role, e.target.value)}
                      className="w-14 text-center border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-semibold text-gray-900 dark:text-gray-100"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {pending ? "Saving…" : "Save Requirements"}
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
