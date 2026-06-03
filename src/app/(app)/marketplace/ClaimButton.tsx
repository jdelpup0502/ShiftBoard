"use client";

import { claimShift } from "@/app/actions/shifts";
import { useTransition, useState } from "react";

export default function ClaimButton({ offerId }: { offerId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimShift(offerId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="w-full md:w-auto md:text-right shrink-0">
      <button
        onClick={handleClaim}
        disabled={pending}
        className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-accent text-accent-fg hover:bg-[var(--accent-hover)] px-5 py-2.5 md:py-2 rounded-md text-[13px] font-semibold uppercase tracking-[0.1em] disabled:opacity-50 transition-colors"
      >
        {pending ? "Claiming…" : "Claim shift"}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-1 md:text-right">{error}</p>}
    </div>
  );
}
