"use client";

import { format } from "date-fns";
import { formatTime } from "@/lib/time";
import OfferButton from "./OfferButton";

const JOB_LABEL: Record<string, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const ROLE_TAG: Record<string, string> = {
  SERVER: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  HOST: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  BUSSER: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  BARTENDER: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
};

interface ShiftItem {
  id: string;
  dateStr: string;
  startTime: string;
  jobTitle: string;
  offerStatus: string | null;
}

function isUpcoming(dateStr: string, startTime: string, now: Date): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm) > now;
}

export function upcomingCount(shifts: ShiftItem[]): number {
  const now = new Date();
  return shifts.filter((s) => isUpcoming(s.dateStr, s.startTime, now)).length;
}

export default function UpcomingShiftsList({ shifts }: { shifts: ShiftItem[] }) {
  const now = new Date();
  const upcoming = shifts.filter((s) => isUpcoming(s.dateStr, s.startTime, now));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 md:mb-4">
        <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-ink">Upcoming shifts</h2>
        <span className="font-mono tnum text-[12px] text-ink-faint">{upcoming.length.toString().padStart(2, "0")}</span>
      </div>
      {upcoming.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-10 text-center bg-sunken/40">
          <p className="text-[13px] text-ink-faint italic">No upcoming shifts scheduled.</p>
        </div>
      ) : (
      <ul className="divide-y divide-line-soft border border-line rounded-xl bg-surface overflow-hidden">
      {upcoming.map((shift) => {
        const [y, m, d] = shift.dateStr.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return (
          <li
            key={shift.id}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 md:px-5 md:py-4 hover:bg-sunken transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-center min-w-[44px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  {format(date, "EEE")}
                </div>
                <div className="font-mono tnum text-[22px] font-semibold leading-none mt-1 text-ink">
                  {format(date, "d")}
                </div>
              </div>
              <div className="w-px h-10 bg-line-soft" />
              <div className="min-w-0">
                <div className="font-mono tnum text-[15px] font-semibold text-ink">
                  {formatTime(shift.startTime)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mt-0.5">
                  {format(date, "MMM yyyy")}
                </div>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm shrink-0 ${ROLE_TAG[shift.jobTitle]}`}>
                {JOB_LABEL[shift.jobTitle]}
              </span>
            </div>
            {shift.offerStatus === "OPEN" ? (
              <span className="self-start md:self-auto text-[10px] uppercase tracking-[0.14em] bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 px-2 py-1 rounded-sm font-semibold">
                Offered up
              </span>
            ) : (
              <OfferButton shiftId={shift.id} dateStr={shift.dateStr} startTime={shift.startTime} />
            )}
          </li>
        );
      })}
    </ul>
      )}
    </section>
  );
}
