"use client";

import { isToday, isTomorrow, format } from "date-fns";

export default function NextShiftLabel({ dateStr }: { dateStr: string }) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isToday(date)) return <span>Today</span>;
  if (isTomorrow(date)) return <span>Tomorrow</span>;
  return <span>{format(date, "EEEE, MMM d")}</span>;
}
