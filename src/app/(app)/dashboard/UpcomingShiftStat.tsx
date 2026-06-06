"use client";

import { upcomingCount } from "./UpcomingShiftsList";

interface ShiftItem {
  dateStr: string;
  startTime: string;
  jobTitle: string;
  offerStatus: string | null;
  id: string;
}

export default function UpcomingShiftStat({ shifts }: { shifts: ShiftItem[] }) {
  const count = upcomingCount(shifts);
  return (
    <div className="bg-surface p-5 md:p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Upcoming</div>
      <div className="display text-[44px] md:text-[52px] text-ink mt-2 leading-none">{count}</div>
      <div className="text-[12px] text-ink-muted mt-2">shifts scheduled</div>
    </div>
  );
}
