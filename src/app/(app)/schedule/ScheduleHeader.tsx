"use client";

import { isSameDay, format } from "date-fns";

function parseLocal(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function ScheduleHeader({ dayStrs }: { dayStrs: string[] }) {
  return (
    <>
      {dayStrs.map((s) => {
        const d = parseLocal(s);
        const isToday = isSameDay(d, new Date());
        return (
          <th
            key={s}
            className={`relative px-2 py-3 text-center border-l border-line align-bottom ${
              isToday ? "bg-accent-soft" : "bg-sunken"
            }`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                isToday ? "text-accent" : "text-ink-muted"
              }`}
            >
              {format(d, "EEE")}
            </div>
            <div
              className={`mt-1 font-mono tnum text-[18px] font-semibold leading-none ${
                isToday ? "text-accent" : "text-ink"
              }`}
            >
              {format(d, "d")}
            </div>
            {isToday && (
              <div className="absolute left-3 right-3 bottom-0 h-[2px] bg-accent" />
            )}
          </th>
        );
      })}
    </>
  );
}
