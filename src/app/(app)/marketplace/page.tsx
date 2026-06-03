import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canClaim } from "@/lib/eligibility";
import { format } from "date-fns";
import ClaimButton from "./ClaimButton";
import { formatTime } from "@/lib/time";

const JOB_LABEL: Record<string, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const ROLE_TAG: Record<string, string> = {
  SERVER: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  HOST: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  BUSSER: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  BARTENDER: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
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
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Marketplace</h1>
        <p className="text-[13px] text-ink-muted mt-3">Pick up open shifts from your coworkers.</p>
      </div>

      {claimable.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-12 text-center bg-sunken/40">
          <p className="text-[15px] font-semibold text-ink-soft">No shifts available right now.</p>
          <p className="text-[13px] text-ink-faint mt-2">Check back later, or ask a coworker to offer up a shift.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line-soft border border-line rounded-xl bg-surface overflow-hidden">
          {claimable.map(({ offer }) => {
            const d = new Date(offer.shift.date);
            return (
              <li
                key={offer.id}
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 md:px-5 md:py-4 hover:bg-sunken transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-center min-w-[48px]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{format(d, "EEE")}</div>
                    <div className="font-mono tnum text-[22px] font-semibold text-ink leading-none mt-1">{format(d, "d")}</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mt-1">{format(d, "MMM")}</div>
                  </div>
                  <div className="w-px h-12 bg-line-soft" />
                  <div className="min-w-0">
                    <div className="font-mono tnum text-[15px] font-semibold text-ink">
                      {formatTime(offer.shift.startTime)}
                    </div>
                    <div className="text-[12px] text-ink-muted mt-1 truncate">
                      from <span className="text-ink-soft font-medium">{offer.offeredBy.name}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm shrink-0 ${ROLE_TAG[offer.shift.jobTitle]}`}>
                    {JOB_LABEL[offer.shift.jobTitle]}
                  </span>
                </div>
                <ClaimButton offerId={offer.id} />
              </li>
            );
          })}
        </ul>
      )}

      {ineligible.length > 0 && (
        <details className="mt-8 group">
          <summary className="text-[12px] text-ink-muted cursor-pointer hover:text-ink-soft select-none list-none flex items-center gap-2 uppercase tracking-[0.14em] font-semibold">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            {`${ineligible.length} offer${ineligible.length !== 1 ? "s" : ""} you can't take`}
          </summary>
          <ul className="mt-3 divide-y divide-line-soft border border-line rounded-xl bg-sunken/40 overflow-hidden">
            {ineligible.map(({ offer, check }) => {
              const d = new Date(offer.shift.date);
              return (
                <li
                  key={offer.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 py-3.5 md:px-5 md:py-3.5 opacity-70"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center min-w-[44px]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{format(d, "EEE")}</div>
                      <div className="font-mono tnum text-[20px] font-medium text-ink-muted leading-none mt-1">{format(d, "d")}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono tnum text-[14px] font-medium text-ink-soft">
                        {formatTime(offer.shift.startTime)}
                      </div>
                      <div className="text-[12px] text-ink-faint mt-0.5 truncate">{check.reason}</div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm shrink-0 ${ROLE_TAG[offer.shift.jobTitle]}`}>
                      {JOB_LABEL[offer.shift.jobTitle]}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint font-semibold self-start md:self-auto">Not eligible</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
