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
        <div className="text-lg font-bold text-gray-400">—</div>
        <div className="text-sm text-gray-400 mt-0.5">None coming up</div>
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
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatTime(shift.startTime)}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </>
  );
}
