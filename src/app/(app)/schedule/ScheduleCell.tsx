"use client";

import { useState, useTransition } from "react";
import { isSameDay } from "date-fns";
import { addShiftSlot, deleteShift } from "@/app/actions/shifts";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { JobTitle } from "@prisma/client";
import { formatTime } from "@/lib/time";
import { parseTimeInput, PRESETS } from "./scheduleCellUtils";

const ROLE_DOT: Record<JobTitle, string> = {
  SERVER: "bg-sky-500",
  HOST: "bg-emerald-500",
  BUSSER: "bg-amber-500",
  BARTENDER: "bg-violet-500",
};

const ROLE_CHIP: Record<JobTitle, string> = {
  SERVER: "bg-sky-50/60 border-sky-100 text-sky-800 dark:bg-sky-950/35 dark:border-sky-900/60 dark:text-sky-200",
  HOST: "bg-emerald-50/60 border-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:border-emerald-900/60 dark:text-emerald-200",
  BUSSER: "bg-amber-50/60 border-amber-100 text-amber-800 dark:bg-amber-950/35 dark:border-amber-900/60 dark:text-amber-200",
  BARTENDER: "bg-violet-50/60 border-violet-100 text-violet-800 dark:bg-violet-950/35 dark:border-violet-900/60 dark:text-violet-200",
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
    ? "bg-accent-soft"
    : short
    ? "bg-red-50 dark:bg-red-950/20"
    : "";

  return (
    <td className={`border-l border-line p-2 align-top ${cellBg}`} style={{ minHeight: "7rem" }}>
      {required > 0 && (
        <div
          className={`text-[10px] font-mono tnum tracking-wider mb-1.5 ${
            short ? "text-red-600 dark:text-red-400 font-semibold" : "text-ink-muted"
          }`}
        >
          {assigned}/{required}
        </div>
      )}

      <div className="space-y-1.5">
        {regularShifts.map((s) => {
          const isMe = s.assignedUserId === currentUserId;
          let chipClass: string;
          let dotClass: string;
          if (s.isOffered) {
            chipClass = "bg-orange-50/60 border-orange-100 text-orange-800 dark:bg-orange-950/35 dark:border-orange-900/60 dark:text-orange-200";
            dotClass = "bg-orange-500";
          } else if (isMe) {
            chipClass = "bg-surface border-accent-edge text-ink";
            dotClass = "bg-accent";
          } else {
            chipClass = ROLE_CHIP[jobTitle];
            dotClass = ROLE_DOT[jobTitle];
          }

          return (
            <div key={s.id} className={`text-[11px] rounded-md border px-2 py-1.5 ${chipClass} relative group`}>
              <div className="flex items-center gap-1.5 pr-4">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                <span className="font-semibold truncate">
                  {s.assignedUserName ?? <span className="italic opacity-60">Unassigned</span>}
                </span>
              </div>
              <div className="font-mono tnum text-[11px] mt-0.5 ml-3 opacity-80">{formatTime(s.startTime)}</div>
              {s.isOffered && (
                <div className="ml-3 text-orange-600 dark:text-orange-400 font-semibold text-[9px] uppercase tracking-[0.12em]">offered</div>
              )}
              {isManager && (
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={pending}
                  className="absolute top-1 right-1 p-1 opacity-70 md:opacity-0 md:group-hover:opacity-70 hover:!opacity-100 hover:text-red-600 transition-opacity disabled:!opacity-30"
                  title="Remove shift"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {trainingShifts.map((s) => (
          <div
            key={s.id}
            className="text-[11px] rounded-md border px-2 py-1.5 bg-violet-50/60 border-violet-100 text-violet-800 dark:bg-violet-950/35 dark:border-violet-900/60 dark:text-violet-200 relative group"
          >
            <div className="flex items-center gap-1.5 pr-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              <span className="font-semibold truncate">{s.traineeName ?? "Trainee"}</span>
              <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">train</span>
            </div>
            <div className="text-[10px] mt-0.5 ml-3 opacity-80 truncate">w/ {s.assignedUserName}</div>
            {isManager && (
              <button
                onClick={() => handleDelete(s.id)}
                disabled={pending}
                className="absolute top-1 right-1 p-1 opacity-70 md:opacity-0 md:group-hover:opacity-70 hover:!opacity-100 hover:text-red-600 transition-opacity disabled:!opacity-30"
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
          className="mt-1.5 w-full flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wide text-ink-faint hover:text-accent hover:bg-accent-soft rounded-md py-1 transition-colors border border-dashed border-line hover:border-accent-edge"
        >
          <PlusIcon className="w-3 h-3" />
          Add
        </button>
      )}

      {isManager && showForm && (
        <div className="mt-1.5 bg-surface border border-accent-edge rounded-md shadow-[0_4px_16px_-4px_oklch(0_0_0/0.12)] p-2.5 space-y-2 z-10">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-sunken text-ink-soft hover:bg-accent-soft hover:text-accent font-medium transition-colors"
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
            className="w-full border border-line rounded-md px-2 py-1 text-[11px] text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-edge"
          />

          <select
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
            className="w-full border border-line rounded-md px-2 py-1 text-[11px] text-ink bg-sunken focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-edge"
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
              className="flex-1 bg-accent text-accent-fg text-[11px] font-semibold py-1 rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              {pending ? "…" : "Add shift"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setStartRaw("3:00pm"); }}
              className="px-2 py-1 text-[11px] text-ink-muted hover:text-ink border border-line rounded-md hover:bg-sunken"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </td>
  );
}
