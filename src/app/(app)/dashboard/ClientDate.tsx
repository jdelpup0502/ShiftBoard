"use client";

import { format } from "date-fns";

export default function ClientDate() {
  return (
    <p className="text-ink-muted text-[13px] mt-3 flex items-center gap-2">
      <span className="font-mono tnum">{format(new Date(), "EEE · MMM d, yyyy").toLowerCase()}</span>
    </p>
  );
}
