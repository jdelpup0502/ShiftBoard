"use client";

import { offerShift } from "@/app/actions/shifts";
import { useTransition } from "react";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";

export default function OfferButton({ shiftId }: { shiftId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await offerShift(shiftId); })}
      disabled={pending}
      className="w-full md:w-auto flex items-center justify-center gap-1.5 text-sm md:text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 px-3 py-2.5 md:py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
    >
      <ArrowRightCircleIcon className="w-4 h-4" />
      {pending ? "…" : "Offer up"}
    </button>
  );
}
