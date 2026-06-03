"use client";

import { useState, useTransition } from "react";
import { isSameDay } from "date-fns";
import { addShiftSlot, deleteShift } from "@/app/actions/shifts";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { JobTitle } from "@prisma/client";
import { formatTime } from "@/lib/time";

function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  const ampm = s.endsWith("am") || s.endsWith("pm") ? s.slice(-2) : null;
  const timePart = ampm ? s.slice(0, -2).trim() : s;
  const [hStr, mStr] = timePart.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr !== undefined ? parseInt(mStr, 10) : 0;
  if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return null;
  if (ampm === "pm" && h !== 12) h += 12;
  else if (ampm === "am" && h === 12) h = 0;
  else if (!ampm && h >= 1 && h <= 11) h += 12;
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const SHIFT_COLOR: Record<JobTitle, string> = {
  SERVER: "bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700",
  HOST: "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700",
  BUSSER: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700",
  BARTENDER: "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700",
};

interface ShiftData {
  id: string;
  startTime: string;
  endTime: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  isTraining: boolean;
  traineeName: string | null;
  isOffered: boolean;
}

interface Employee {
  id: string;
  name: string;
}

interface Props {
  dateStr: string;
  jobTitle: JobTitle;
  required: number;
  currentUserId: string;
  isManager: boolean;
  shifts: ShiftData[];
  employees: Employee[];
}

const PRESETS = [
  { label: "2:30", start: "2:30pm" },
  { label: "3:00", start: "3:00pm" },
  { label: "3:30", start: "3:30pm" },
  { label: "4:00", start: "4:00pm" },
];

export default function ScheduleCell({
  dateStr,
  jobTitle,
  required,
  currentUserId,
  isManager,
  shifts,
  employees,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [startRaw, setStartRaw] = useState("3:00pm");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [y, m, d] = dateStr.split("-").map(Number);
  const isToday = isSameDay(new Date(y, m - 1, d), new Date());
  const regularShifts = shifts.filter((s) => !s.isTraining);
  const trainingShifts = shifts.filter((s) => s.isTraining);
  const assigned = regularShifts.filter((s) => s.assignedUserId).length;
  const short = required > 0 && assigned < required;

  function applyPreset(preset: typeof PRESETS[0]) {
    setStartRaw(preset.start);
  }

  function handleAdd() {
    setError(null);
    const parsed = parseTimeInput(startRaw);
    if (!parsed) {
      setError("Enter a valid time like 3:30 or 9pm");
      return;
    }
    startTransition(async () => {
      const result = await addShiftSlot(dateStr, jobTitle, parsed, assignedUserId || null);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        setAssignedUserId("");
        setStartRaw("3:00pm");
      }
    });
  }

  function handleDelete(shiftId: string) {
    startTransition(async () => { await deleteShift(shiftId); });
  }

  const cellBg = isToday
    ? "bg-indigo-100 dark:bg-indigo-900/20"
    : short
    ? "bg-red-100 dark:bg-red-900/20"
    : "";

  return (
    <td className={`border-l border-gray-200 dark:border-gray-700 p-2 align-top ${cellBg}`} style={{ minHeight: "7rem" }}>
      {required > 0 && (
        <div className={`text-xs font-bold mb-1.5 ${short ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {assigned}/{required}
        </div>
      )}

      <div className="space-y-1.5">
        {regularShifts.map((s) => {
          const isMe = s.assignedUserId === currentUserId;
          const chipClass = s.isOffered
            ? "bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700"
            : isMe
            ? "bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700"
            : `${SHIFT_COLOR[jobTitle]} border`;

          return (
            <div key={s.id} className={`text-xs rounded-lg px-2 py-1.5 ${chipClass} relative group`}>
              <div className="font-semibold truncate pr-4">
                {s.assignedUserName ?? <span className="italic text-gray-500 dark:text-gray-400">Unassigned</span>}
              </div>
              <div className="font-medium mt-0.5">{formatTime(s.startTime)}</div>
              {s.isOffered && (
                <div className="text-orange-600 dark:text-orange-400 font-semibold text-[10px]">offered</div>
              )}
              {isManager && (
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={pending}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity disabled:opacity-30"
                  title="Remove shift"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {trainingShifts.map((s) => (
          <div
            key={s.id}
            className="text-xs rounded-lg px-2 py-1.5 bg-violet-100 text-violet-900 border border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700 relative group"
          >
            <div className="font-semibold truncate pr-4">🎓 {s.traineeName ?? "Trainee"}</div>
            <div className="font-medium mt-0.5 truncate text-violet-700 dark:text-violet-300">w/ {s.assignedUserName}</div>
            {isManager && (
              <button
                onClick={() => handleDelete(s.id)}
                disabled={pending}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity disabled:opacity-30"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isManager && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-1.5 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg py-1 transition-colors border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-300"
        >
          <PlusIcon className="w-3 h-3" />
          Add
        </button>
      )}

      {isManager && showForm && (
        <div className="mt-1.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl shadow-lg p-3 space-y-2 z-10">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="e.g. 3:30 or 9pm"
            value={startRaw}
            onChange={(e) => setStartRaw(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-1.5 py-1 text-[11px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />

          <select
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-[11px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">— Unassigned —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          {error && <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-1.5">
            <button
              onClick={handleAdd}
              disabled={pending}
              className="flex-1 bg-indigo-600 text-white text-[11px] font-semibold py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "…" : "Add shift"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setStartRaw("3:00pm"); }}
              className="px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </td>
  );
}
