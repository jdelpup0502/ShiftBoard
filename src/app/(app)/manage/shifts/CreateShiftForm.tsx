"use client";

import { createShift } from "@/app/actions/shifts";
import { useState, useTransition } from "react";
import type { JobTitle } from "@prisma/client";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";

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

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
        <PlusIcon className="w-4 h-4 text-indigo-500" />
        Create New Shift
      </h2>
      <form action={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Date</label>
          <input name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Job Title</label>
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Start Time</label>
          <input name="startTime" type="time" required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">End Time</label>
          <input name="endTime" type="time" required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Assigned Employee</label>
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
              <div className={`w-10 h-6 rounded-full transition-colors ${isTraining ? "bg-indigo-600" : "bg-gray-200"}`} />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isTraining ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Training shift</span>
          </label>
        </div>
        {isTraining && (
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Trainee</label>
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
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {pending ? "Creating…" : "Create Shift"}
          </button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckIcon className="w-4 h-4" /> Shift created!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
