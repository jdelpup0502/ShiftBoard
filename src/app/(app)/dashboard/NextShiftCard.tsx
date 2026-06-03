"use client";

import { useEffect, useState } from "react";
import { isToday, isTomorrow, format } from "date-fns";
import { formatTime } from "@/lib/time";

interface ShiftInfo {
  dateStr: string;
  startTime: string;
}

function parseShiftStart(dateStr: string, startTime: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function pickIndex(shifts: ShiftInfo[], now: Date): number {
  for (let i = 0; i < shifts.length; i++) {
    if (parseShiftStart(shifts[i].dateStr, shifts[i].startTime) >= now) return i;
  }
  return -1;
}

export default function NextShiftCard({ shifts }: { shifts: ShiftInfo[] }) {
  const [index, setIndex] = useState(shifts.length > 0 ? 0 : -1);

  useEffect(() => {
    setIndex(pickIndex(shifts, new Date()));
  }, [shifts]);

  if (index === -1) {
    return (
      <>
        <div className="display text-[44px] md:text-[52px] text-ink-faint mt-2 leading-none">—</div>
        <div className="text-[12px] text-ink-muted mt-2">None coming up</div>
      </>
    );
  }

  const shift = shifts[index];
  const [y, m, d] = shift.dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = isToday(date)
    ? "Today"
    : isTomorrow(date)
    ? "Tomorrow"
    : format(date, "EEEE, MMM d");

  return (
    <>
      <div className="font-mono tnum text-[40px] md:text-[48px] text-ink mt-2 leading-none font-medium tracking-tight">
        {formatTime(shift.startTime)}
      </div>
      <div className="text-[12px] text-ink-muted mt-2">{label}</div>
    </>
  );
}
