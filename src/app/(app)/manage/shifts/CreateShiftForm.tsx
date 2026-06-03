"use client";

import { createShift } from "@/app/actions/shifts";
import { useState, useTransition } from "react";
import type { JobTitle } from "@prisma/client";
import { CheckIcon } from "@heroicons/react/24/outline";

const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];
const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

interface Employee {
  id: string;
  name: string;
  jobTitles: JobTitle[];
}

export default function CreateShiftForm({ employees }: { employees: Employee[] }) {
  const [isTraining, setIsTraining] = useState(false);
  const [selectedRole, setSelectedRole] = useState<JobTitle>("SERVER");
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const eligibleEmployees = employees.filter((e) => e.jobTitles.includes(selectedRole));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("isTraining", isTraining.toString());
      await createShift(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  const inputClass =
    "w-full border border-line rounded-md px-3 py-2 text-sm text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent-edge transition-colors placeholder:text-ink-faint";

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <h2 className="text-[18px] font-semibold tracking-tight text-ink mb-5">Create new shift</h2>
      <form action={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">Date</label>
          <input name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">Role</label>
          <select
            name="jobTitle"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as JobTitle)}
            className={inputClass}
          >
            {JOB_TITLES.map((t) => (
              <option key={t} value={t}>{JOB_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">Start time</label>
          <input name="startTime" type="time" required className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">End time</label>
          <input name="endTime" type="time" required className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">Assigned employee</label>
          <select name="assignedUserId" className={inputClass}>
            <option value="">— Unassigned —</option>
            {eligibleEmployees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isTraining}
                onChange={(e) => setIsTraining(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${isTraining ? "bg-accent" : "bg-line"}`} />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isTraining ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-[13px] font-medium text-ink-soft">Training shift</span>
          </label>
        </div>
        {isTraining && (
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2">Trainee</label>
            <select name="traineeUserId" className={inputClass}>
              <option value="">— Select trainee —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="col-span-2 flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-accent-fg rounded-md px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {pending ? "Creating…" : "Create shift"}
          </button>
          {success && (
            <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckIcon className="w-4 h-4" /> Shift created
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
