import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canClaim } from "@/lib/eligibility";
import { format } from "date-fns";
import ClaimButton from "./ClaimButton";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { formatTime } from "@/lib/time";

const JOB_LABEL: Record<string, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const JOB_COLOR: Record<string, string> = {
  SERVER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  HOST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  BUSSER: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  BARTENDER: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

export default async function MarketplacePage() {
  const user = await requireUser();

  const openOffers = await db.shiftOffer.findMany({
    where: { status: "OPEN" },
    include: { shift: true, offeredBy: { select: { name: true } } },
    orderBy: { shift: { date: "asc" } },
  });

  const eligibleOffers = await Promise.all(
    openOffers.map(async (offer) => ({ offer, check: await canClaim(user.id, offer.shift) }))
  );

  const claimable = eligibleOffers.filter((e) => e.check.ok);
  const ineligible = eligibleOffers.filter((e) => !e.check.ok && e.offer.offeredById !== user.id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shift Marketplace</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Pick up open shifts from your coworkers.</p>

      {claimable.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <ShoppingBagIcon className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No shifts available to claim.</p>
          <p className="text-sm text-gray-400 mt-1">Check back later or ask a coworker to offer up their shift.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claimable.map(({ offer }) => {
            const d = new Date(offer.shift.date);
            return (
              <div
                key={offer.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[44px]">
                    <div className="text-xs font-semibold text-gray-400 uppercase">{format(d, "EEE")}</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">{format(d, "d")}</div>
                    <div className="text-xs text-gray-400">{format(d, "MMM")}</div>
                  </div>
                  <div className="w-px h-10 bg-gray-100 dark:bg-gray-700" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(offer.shift.startTime)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Offered by <span className="font-medium text-gray-600 dark:text-gray-300">{offer.offeredBy.name}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_COLOR[offer.shift.jobTitle]}`}>
                    {JOB_LABEL[offer.shift.jobTitle]}
                  </span>
                </div>
                <ClaimButton offerId={offer.id} />
              </div>
            );
          })}
        </div>
      )}

      {ineligible.length > 0 && (
        <details className="mt-8 group">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 select-none list-none flex items-center gap-1.5">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {`${ineligible.length} offer${ineligible.length !== 1 ? "s" : ""} you can’t take`}
          </summary>
          <div className="mt-3 space-y-2">
            {ineligible.map(({ offer, check }) => {
              const d = new Date(offer.shift.date);
              return (
                <div
                  key={offer.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-3.5 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[44px]">
                      <div className="text-xs font-semibold text-gray-400 uppercase">{format(d, "EEE")}</div>
                      <div className="text-xl font-bold text-gray-500 dark:text-gray-400 leading-none">{format(d, "d")}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatTime(offer.shift.startTime)}
                      </div>
                      <div className="text-xs text-gray-400">{check.reason}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_COLOR[offer.shift.jobTitle]}`}>
                      {JOB_LABEL[offer.shift.jobTitle]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Not eligible</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
