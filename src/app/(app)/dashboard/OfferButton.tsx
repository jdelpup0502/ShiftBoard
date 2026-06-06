"use client";

import { offerShift } from "@/app/actions/shifts";
import { useTransition } from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

export default function OfferButton({ shiftId, dateStr, startTime }: { shiftId: string; dateStr: string; startTime: string }) {
  const [pending, startTransition] = useTransition();

  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  const shiftStart = new Date(y, m - 1, d, hh, mm);
  if (shiftStart <= new Date()) return null;

  return (
    <button
      onClick={() => startTransition(async () => { await offerShift(shiftId); })}
      disabled={pending}
      className="w-full md:w-auto flex items-center justify-center gap-1.5 text-[12px] uppercase tracking-[0.12em] bg-surface border border-line text-ink-soft hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 px-3 py-2.5 md:py-2 rounded-md font-semibold disabled:opacity-50 transition-colors"
    >
      {pending ? "…" : "Offer up"}
      <ArrowUpRightIcon className="w-3.5 h-3.5" />
    </button>
  );
}
