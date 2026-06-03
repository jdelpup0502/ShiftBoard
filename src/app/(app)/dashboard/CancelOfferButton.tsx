"use client";

import { cancelOffer } from "@/app/actions/shifts";
import { useTransition } from "react";

export default function CancelOfferButton({ offerId }: { offerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await cancelOffer(offerId); })}
      disabled={pending}
      className="w-full md:w-auto flex items-center justify-center gap-1.5 text-[12px] uppercase tracking-[0.12em] bg-surface border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/40 px-3 py-2.5 md:py-2 rounded-md font-semibold disabled:opacity-50 transition-colors"
    >
      {pending ? "…" : "Take back"}
    </button>
  );
}
