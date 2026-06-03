"use client";

import { isToday, isTomorrow, format } from "date-fns";

export default function NextShiftLabel({ dateISO }: { dateISO: string }) {
  const date = new Date(dateISO);
  if (isToday(date)) return <span>Today</span>;
  if (isTomorrow(date)) return <span>Tomorrow</span>;
  return <span>{format(date, "EEEE, MMM d")}</span>;
}
