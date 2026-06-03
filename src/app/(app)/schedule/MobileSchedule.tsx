"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { isSameDay, format } from "date-fns";
import {
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import type { JobTitle } from "@prisma/client";
import { formatTime } from "@/lib/time";
import { addShiftSlot, deleteShift } from "@/app/actions/shifts";
import { parseTimeInput, PRESETS } from "./scheduleCellUtils";

const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];

const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const ROLE_BADGE: Record<JobTitle, string> = {
  SERVER: "bg-blue-600 text-white",
  HOST: "bg-emerald-600 text-white",
  BUSSER: "bg-amber-500 text-white",
  BARTENDER: "bg-purple-600 text-white",
};

const SHIFT_COLOR: Record<JobTitle, string> = {
  SERVER: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  HOST: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
  BUSSER: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  BARTENDER: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
};

interface ShiftData {
  id: string;
  date: string; // yyyy-MM-dd
  jobTitle: JobTitle;
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
  dayStrs: string[]; // 6 strings yyyy-MM-dd
  currentUserId: string;
  isManager: boolean;
  shifts: ShiftData[];
  reqMap: Record<string, number>; // key `${dow}-${role}` -> count
  employeesByRole: Record<JobTitle, Employee[]>;
}

function parseLocal(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function MobileSchedule({
  dayStrs,
  currentUserId,
  isManager,
  shifts,
  reqMap,
  employeesByRole,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const initialIndex = useMemo(() => {
    const idx = dayStrs.findIndex((s) => isSameDay(parseLocal(s), today));
    return idx >= 0 ? idx : 0;
  }, [dayStrs, today]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // If dayStrs change (week navigation), reset selection
  useEffect(() => {
    setSelectedIndex(initialIndex);
  }, [initialIndex]);

  const selectedDayStr = dayStrs[selectedIndex];
  const selectedDate = parseLocal(selectedDayStr);

  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < dayStrs.length - 1;

  const dayShifts = shifts.filter((s) => s.date === selectedDayStr);

  return (
    <div className="space-y-4">
      {/* Day pager */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => canPrev && setSelectedIndex(selectedIndex - 1)}
          disabled={!canPrev}
          aria-label="Previous day"
          className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {format(selectedDate, "EEEE")}
          </div>
          <div className="text-base font-bold text-gray-900 dark:text-gray-100">
            {format(selectedDate, "MMM d")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => canNext && setSelectedIndex(selectedIndex + 1)}
          disabled={!canNext}
          aria-label="Next day"
          className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Day chip strip */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {dayStrs.map((s, i) => {
          const d = parseLocal(s);
          const isToday = isSameDay(d, today);
          const isSelected = i === selectedIndex;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`shrink-0 min-w-[52px] flex flex-col items-center justify-center rounded-lg px-2 py-1.5 border ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : isToday
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {format(d, "EEE")}
              </span>
              <span className="text-sm font-bold">{format(d, "d")}</span>
            </button>
          );
        })}
      </div>

      {/* Role sections */}
      <div className="space-y-3">
        {JOB_TITLES.map((role) => {
          const dow = selectedDate.getDay();
          const required = reqMap[`${dow}-${role}`] ?? 0;
          const roleShifts = dayShifts.filter((s) => s.jobTitle === role);
          return (
            <RoleSection
              key={role}
              role={role}
              dateStr={selectedDayStr}
              required={required}
              currentUserId={currentUserId}
              isManager={isManager}
              shifts={roleShifts}
              employees={employeesByRole[role] ?? []}
            />
          );
        })}
      </div>
    </div>
  );
}

function RoleSection({
  role,
  dateStr,
  required,
  currentUserId,
  isManager,
  shifts,
  employees,
}: {
  role: JobTitle;
  dateStr: string;
  required: number;
  currentUserId: string;
  isManager: boolean;
  shifts: ShiftData[];
  employees: Employee[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [startRaw, setStartRaw] = useState("3:00pm");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const regular = shifts.filter((s) => !s.isTraining);
  const training = shifts.filter((s) => s.isTraining);
  const assigned = regular.filter((s) => s.assignedUserId).length;
  const short = required > 0 && assigned < required;

  function handleAdd() {
    setError(null);
    const parsed = parseTimeInput(startRaw);
    if (!parsed) {
      setError("Enter a valid time like 3:30 or 9pm");
      return;
    }
    startTransition(async () => {
      const result = await addShiftSlot(dateStr, role, parsed, assignedUserId || null);
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
    startTransition(async () => {
      await deleteShift(shiftId);
    });
  }

  return (
    <section className={`rounded-xl border bg-white dark:bg-gray-800 shadow-sm overflow-hidden ${short ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-gray-700"}`}>
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}>
            {JOB_LABEL[role]}
          </span>
          {required > 0 && (
            <span className={`text-xs font-semibold ${short ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              {assigned}/{required} staffed
            </span>
          )}
        </div>
      </header>

      <div className="p-3 space-y-2">
        {regular.length === 0 && training.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No shifts scheduled.</p>
        )}

        {regular.map((s) => {
          const isMe = s.assignedUserId === currentUserId;
          const chipClass = s.isOffered
            ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700"
            : isMe
            ? "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700"
            : SHIFT_COLOR[role];
          return (
            <div key={s.id} className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2.5 ${chipClass}`}>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {s.assignedUserName ?? <span className="italic opacity-70">Unassigned</span>}
                </div>
                <div className="text-xs font-medium opacity-90 mt-0.5">
                  {formatTime(s.startTime)}
                  {s.isOffered && <span className="ml-2 text-orange-700 dark:text-orange-300 font-semibold uppercase tracking-wide text-[10px]">Offered</span>}
                </div>
              </div>
              {isManager && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={pending}
                  aria-label="Remove shift"
                  className="shrink-0 p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}

        {training.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2.5 bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">🎓 {s.traineeName ?? "Trainee"}</div>
              <div className="text-xs font-medium opacity-90 mt-0.5">w/ {s.assignedUserName}</div>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                disabled={pending}
                aria-label="Remove training shift"
                className="shrink-0 p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        {isManager && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg py-2.5 border border-dashed border-gray-300 dark:border-gray-600"
          >
            <PlusIcon className="w-4 h-4" />
            Add shift
          </button>
        )}

        {isManager && showForm && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStartRaw(p.start)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
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
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Unassigned —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={pending}
                className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Add shift"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setStartRaw("3:00pm");
                }}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
