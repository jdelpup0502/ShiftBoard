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

const ROLE_CHIP: Record<JobTitle, string> = {
  SERVER: "bg-sky-50/60 border-sky-100 text-sky-800 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-200",
  HOST: "bg-emerald-50/60 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-200",
  BUSSER: "bg-amber-50/60 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-200",
  BARTENDER: "bg-violet-50/60 border-violet-100 text-violet-800 dark:bg-violet-950/20 dark:border-violet-900/40 dark:text-violet-200",
};

interface ShiftData {
  id: string;
  date: string;
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
  dayStrs: string[];
  currentUserId: string;
  isManager: boolean;
  shifts: ShiftData[];
  reqMap: Record<string, number>;
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
      <div className="flex items-center justify-between gap-2 bg-surface border border-line rounded-xl px-2 py-2">
        <button
          type="button"
          onClick={() => canPrev && setSelectedIndex(selectedIndex - 1)}
          disabled={!canPrev}
          aria-label="Previous day"
          className="p-2.5 rounded-md text-ink-muted disabled:opacity-30 hover:bg-sunken hover:text-ink"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            {format(selectedDate, "EEEE")}
          </div>
          <div className="font-mono tnum text-[18px] font-semibold text-ink mt-0.5">
            {format(selectedDate, "MMM d")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => canNext && setSelectedIndex(selectedIndex + 1)}
          disabled={!canNext}
          aria-label="Next day"
          className="p-2.5 rounded-md text-ink-muted disabled:opacity-30 hover:bg-sunken hover:text-ink"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Day chip strip */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {dayStrs.map((s, i) => {
          const d = parseLocal(s);
          const isToday = isSameDay(d, today);
          const isSelected = i === selectedIndex;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative shrink-0 min-w-[52px] flex flex-col items-center justify-center rounded-md px-2 py-2 border transition-colors ${
                isSelected
                  ? "bg-ink border-ink text-paper"
                  : isToday
                  ? "bg-accent-soft border-accent-edge text-accent"
                  : "bg-surface border-line text-ink-soft"
              }`}
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">
                {format(d, "EEE")}
              </span>
              <span className="font-mono tnum text-[15px] font-semibold mt-0.5">{format(d, "d")}</span>
              {isToday && !isSelected && (
                <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] bg-accent rounded-full" />
              )}
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
    <section className={`rounded-xl border bg-surface overflow-hidden ${short ? "border-red-300 dark:border-red-900" : "border-line"}`}>
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-line-soft">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${ROLE_DOT[role]}`} />
          <span className={`text-[13px] font-semibold ${ROLE_INK[role]}`}>
            {JOB_LABEL[role]}
          </span>
        </div>
        {required > 0 && (
          <span
            className={`font-mono tnum text-[11px] ${
              short ? "text-red-600 dark:text-red-400 font-semibold" : "text-ink-muted"
            }`}
          >
            {assigned}/{required} staffed
          </span>
        )}
      </header>

      <div className="p-3 space-y-2">
        {regular.length === 0 && training.length === 0 && (
          <p className="text-[13px] text-ink-faint italic">No shifts scheduled.</p>
        )}

        {regular.map((s) => {
          const isMe = s.assignedUserId === currentUserId;
          let chipClass: string;
          let dotClass: string;
          if (s.isOffered) {
            chipClass = "bg-orange-50/60 border-orange-100 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/40 dark:text-orange-200";
            dotClass = "bg-orange-500";
          } else if (isMe) {
            chipClass = "bg-surface border-accent-edge text-ink";
            dotClass = "bg-accent";
          } else {
            chipClass = ROLE_CHIP[role];
            dotClass = ROLE_DOT[role];
          }
          return (
            <div key={s.id} className={`flex items-center justify-between gap-2 border rounded-md px-3 py-2.5 ${chipClass}`}>
              <div className="min-w-0 flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {s.assignedUserName ?? <span className="italic opacity-60">Unassigned</span>}
                  </div>
                  <div className="font-mono tnum text-[12px] opacity-80 mt-0.5">
                    {formatTime(s.startTime)}
                    {s.isOffered && <span className="ml-2 text-orange-700 dark:text-orange-300 font-semibold uppercase tracking-[0.14em] text-[10px]">Offered</span>}
                  </div>
                </div>
              </div>
              {isManager && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={pending}
                  aria-label="Remove shift"
                  className="shrink-0 p-2 rounded-md hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}

        {training.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 border rounded-md px-3 py-2.5 bg-violet-50/60 border-violet-100 text-violet-800 dark:bg-violet-950/20 dark:border-violet-900/40 dark:text-violet-200"
          >
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate flex items-center gap-2">
                  {s.traineeName ?? "Trainee"}
                  <span className="text-[9px] uppercase tracking-[0.14em] opacity-70 font-semibold">train</span>
                </div>
                <div className="text-[12px] opacity-80 mt-0.5">w/ {s.assignedUserName}</div>
              </div>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                disabled={pending}
                aria-label="Remove training shift"
                className="shrink-0 p-2 rounded-md hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {isManager && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-faint hover:text-accent hover:bg-accent-soft rounded-md py-2.5 border border-dashed border-line hover:border-accent-edge"
          >
            <PlusIcon className="w-4 h-4" />
            Add shift
          </button>
        )}

        {isManager && showForm && (
          <div className="bg-sunken border border-accent-edge rounded-xl p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStartRaw(p.start)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-surface border border-line text-ink-soft hover:bg-accent-soft hover:text-accent hover:border-accent-edge font-semibold"
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
              className="w-full border border-line rounded-md px-3 py-2.5 text-base text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-edge"
            />

            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2.5 text-base text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-edge"
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
                className="flex-1 bg-accent text-accent-fg text-sm font-semibold py-2.5 rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50"
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
                className="px-4 py-2.5 text-sm font-semibold text-ink-soft border border-line rounded-md hover:bg-sunken"
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
