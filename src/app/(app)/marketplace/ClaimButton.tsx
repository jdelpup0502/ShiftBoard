"use client";

import { claimShift } from "@/app/actions/shifts";
import { useTransition, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

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
        className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 md:py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
      >
        <CheckCircleIcon className="w-4 h-4" />
        {pending ? "Claiming…" : "Claim"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1 md:text-right">{error}</p>}
    </div>
  );
}
