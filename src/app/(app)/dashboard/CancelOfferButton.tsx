"use client";

import { cancelOffer } from "@/app/actions/shifts";
import { useTransition } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default function CancelOfferButton({ offerId }: { offerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await cancelOffer(offerId); })}
      disabled={pending}
      className="w-full md:w-auto flex items-center justify-center gap-1.5 text-sm md:text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2.5 md:py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
    >
      <XCircleIcon className="w-4 h-4" />
      {pending ? "…" : "Cancel"}
    </button>
  );
}
