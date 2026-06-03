"use client";

import { updateEmployeeJobs, updateRole, deleteEmployee } from "@/app/actions/employees";
import { useState, useTransition } from "react";
import type { JobTitle, Role } from "@prisma/client";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const JOB_ACTIVE: Record<JobTitle, string> = {
  SERVER: "bg-blue-600 text-white border-blue-600",
  HOST: "bg-emerald-600 text-white border-emerald-600",
  BUSSER: "bg-amber-500 text-white border-amber-500",
  BARTENDER: "bg-purple-600 text-white border-purple-600",
};

interface Props {
  user: { id: string; name: string; email: string; role: Role };
  currentJobTitles: JobTitle[];
  allJobTitles: JobTitle[];
}

export default function EmployeeRow({ user, currentJobTitles, allJobTitles }: Props) {
  const [selected, setSelected] = useState<Set<JobTitle>>(new Set(currentJobTitles));
  const [role, setRole] = useState<Role>(user.role);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleJob(job: JobTitle) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(job)) next.delete(job);
      else next.add(job);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updateEmployeeJobs(user.id, Array.from(selected));
      await updateRole(user.id, role);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm(`Remove ${user.name} from the system?`)) return;
    startTransition(() => deleteEmployee(user.id));
  }

  return (
    <div className={`px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 md:flex-wrap transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 md:min-w-[180px]">
        <div className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold uppercase shrink-0">
          {user.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.name}</div>
          <div className="text-xs text-gray-400 truncate">{user.email}</div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {allJobTitles.map((job) => (
          <button
            key={job}
            type="button"
            onClick={() => toggleJob(job)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              selected.has(job)
                ? JOB_ACTIVE[job]
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400"
            }`}
          >
            {JOB_LABEL[job]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:contents">
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as Role); setSaved(false); }}
          className="flex-1 md:flex-none text-sm md:text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 md:px-2.5 md:py-1.5 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
        </select>

        <div className="flex items-center gap-2 md:ml-auto">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckIcon className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="text-sm md:text-xs bg-indigo-600 text-white rounded-lg px-4 py-2 md:px-3 md:py-1.5 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Remove employee"
            className="p-2 -mr-1 text-gray-400 dark:text-gray-500 hover:text-red-500 disabled:opacity-50 transition-colors"
          >
            <TrashIcon className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
