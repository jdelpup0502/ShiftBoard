"use client";

import { deleteShift, assignShift } from "@/app/actions/shifts";
import { useTransition } from "react";
import { format } from "date-fns";
import type { JobTitle, OfferStatus } from "@prisma/client";
import { TrashIcon } from "@heroicons/react/24/outline";
import { formatTime } from "@/lib/time";

const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const ROLE_TAG: Record<JobTitle, string> = {
  SERVER: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  HOST: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  BUSSER: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  BARTENDER: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
};

interface ShiftData {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  jobTitle: JobTitle;
  assignedUserId: string | null;
  assignedUserName: string | null;
  isTraining: boolean;
  traineeId: string | null;
  traineeName: string | null;
  offerStatus: OfferStatus | null;
}

interface Employee {
  id: string;
  name: string;
  jobTitles: JobTitle[];
}

interface Props {
  shift: ShiftData;
  employees: Employee[];
}

export default function ShiftManagerRow({ shift, employees }: Props) {
  const [pending, startTransition] = useTransition();
  const eligibleEmployees = employees.filter((e) => e.jobTitles.includes(shift.jobTitle));

  function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const select = e.target;
    const userId = select.value || null;
    const previousValue = shift.assignedUserId ?? "";
    startTransition(async () => {
      const result = await assignShift(shift.id, userId);
      if (result?.error) {
        alert(result.error);
        select.value = previousValue;
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this shift?")) return;
    startTransition(() => deleteShift(shift.id));
  }

  return (
    <div className={`px-5 py-4 flex items-center gap-4 flex-wrap transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="min-w-[110px]">
        <div className="text-[13px] font-semibold text-ink">{format(new Date(shift.date), "EEE, MMM d")}</div>
        <div className="font-mono tnum text-[12px] text-ink-muted mt-0.5">{formatTime(shift.startTime)}</div>
      </div>

      <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm ${
        shift.isTraining ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" : ROLE_TAG[shift.jobTitle]
      }`}>
        {JOB_LABEL[shift.jobTitle]}{shift.isTraining && " · Train"}
      </span>

      {shift.isTraining ? (
        <div className="text-[13px] text-ink-soft flex items-center gap-1.5">
          <span className="font-medium text-ink">{shift.assignedUserName ?? "No trainer"}</span>
          <span className="text-ink-faint">+</span>
          <span className="text-violet-600 dark:text-violet-300 font-medium">{shift.traineeName ?? "No trainee"}</span>
        </div>
      ) : (
        <select
          defaultValue={shift.assignedUserId ?? ""}
          onChange={handleAssign}
          disabled={pending}
          className="text-[13px] border border-line rounded-md px-3 py-1.5 bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/35 text-ink"
        >
          <option value="">— Unassigned —</option>
          {eligibleEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      )}

      {shift.offerStatus === "OPEN" && (
        <span className="text-[10px] uppercase tracking-[0.14em] bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 px-1.5 py-0.5 rounded-sm font-semibold">
          Offered up
        </span>
      )}

      <button
        onClick={handleDelete}
        disabled={pending}
        title="Delete shift"
        className="ml-auto text-ink-faint hover:text-red-500 disabled:opacity-50 transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
