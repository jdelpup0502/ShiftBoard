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

const JOB_COLOR: Record<JobTitle, string> = {
  SERVER: "bg-blue-100 text-blue-700",
  HOST: "bg-emerald-100 text-emerald-700",
  BUSSER: "bg-amber-100 text-amber-700",
  BARTENDER: "bg-purple-100 text-purple-700",
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
    const userId = e.target.value || null;
    startTransition(() => assignShift(shift.id, userId));
  }

  function handleDelete() {
    if (!confirm("Delete this shift?")) return;
    startTransition(() => deleteShift(shift.id));
  }

  return (
    <div className={`px-5 py-3.5 flex items-center gap-4 flex-wrap transition-opacity ${pending ? "opacity-50" : ""}`}>
      {/* Date */}
      <div className="min-w-[110px]">
        <div className="text-sm font-semibold text-gray-900">{format(new Date(shift.date), "EEE, MMM d")}</div>
        <div className="text-xs text-gray-400">{formatTime(shift.startTime)}</div>
      </div>

      {/* Role badge */}
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        shift.isTraining ? "bg-violet-100 text-violet-700" : JOB_COLOR[shift.jobTitle]
      }`}>
        {JOB_LABEL[shift.jobTitle]}{shift.isTraining && " 🎓"}
      </span>

      {/* Assign */}
      {shift.isTraining ? (
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <span className="font-medium">{shift.assignedUserName ?? "No trainer"}</span>
          <span className="text-gray-300">+</span>
          <span className="text-violet-600 font-medium">{shift.traineeName ?? "No trainee"}</span>
        </div>
      ) : (
        <select
          defaultValue={shift.assignedUserId ?? ""}
          onChange={handleAssign}
          disabled={pending}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        >
          <option value="">— Unassigned —</option>
          {eligibleEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      )}

      {/* Offered badge */}
      {shift.offerStatus === "OPEN" && (
        <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-semibold">
          Offered up
        </span>
      )}

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={pending}
        title="Delete shift"
        className="ml-auto text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
