import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { format, startOfDay } from "date-fns";
import ClientDate from "./ClientDate";
import NextShiftCard from "./NextShiftCard";
import UpcomingShiftsList from "./UpcomingShiftsList";
import UpcomingShiftStat from "./UpcomingShiftStat";
import CancelOfferButton from "./CancelOfferButton";
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

export default async function DashboardPage() {
  const user = await requireUser();
  const today = startOfDay(new Date());

  const [myShifts, myOffers] = await Promise.all([
    db.shift.findMany({
      where: { assignedUserId: user.id, isTraining: false, date: { gte: today } },
      include: { offer: true },
      orderBy: { date: "asc" },
    }),
    db.shiftOffer.findMany({
      where: { offeredById: user.id, status: "OPEN" },
      include: { shift: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const nextShiftCandidates = myShifts.map((s) => ({
    dateStr: format(s.date, "yyyy-MM-dd"),
    startTime: s.startTime,
  }));

  const firstName = user.name.split(" ")[0];

  return (
    <div className="max-w-4xl space-y-8 md:space-y-10">
      <div>
        <h1 className="display text-[34px] md:text-[48px] text-ink leading-[0.95]">
          Hello, <span className="text-accent">{firstName}.</span>
        </h1>
        <ClientDate />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
        <UpcomingShiftStat shifts={myShifts.map((s) => ({ id: s.id, dateStr: format(s.date, "yyyy-MM-dd"), startTime: s.startTime, jobTitle: s.jobTitle, offerStatus: s.offer?.status ?? null }))} />
        <Stat label="Offered up" value={myOffers.length.toString()} sub="awaiting pickup" />
        <NextShiftStat shifts={nextShiftCandidates} />
      </div>

      {/* Upcoming shifts */}
      <UpcomingShiftsList
          shifts={myShifts.map((s) => ({
            id: s.id,
            dateStr: format(s.date, "yyyy-MM-dd"),
            startTime: s.startTime,
            jobTitle: s.jobTitle,
            offerStatus: s.offer?.status ?? null,
          }))}
        />

      {/* Offered shifts */}
      {myOffers.length > 0 && (
        <section>
          <SectionHeading title="Shifts you've offered" count={myOffers.length} accent />
          <ul className="divide-y divide-orange-200 dark:divide-orange-900/50 border border-orange-200 dark:border-orange-900/60 rounded-xl bg-orange-50/30 dark:bg-orange-950/15 overflow-hidden">
            {myOffers.map((offer) => {
              const d = new Date(offer.shift.date);
              return (
                <li
                  key={offer.id}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 md:px-5 md:py-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <DateBlock date={d} accent />
                    <div className="w-px h-10 bg-orange-200 dark:bg-orange-900/60" />
                    <div className="min-w-0">
                      <div className="font-mono tnum text-[15px] font-semibold text-ink">
                        {formatTime(offer.shift.startTime)}
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-orange-700 dark:text-orange-400 mt-0.5">
                        Awaiting pickup
                      </div>
                    </div>
                    <RoleTag job={offer.shift.jobTitle} />
                  </div>
                  <CancelOfferButton offerId={offer.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(user.role === "MANAGER" || user.isAdmin) && (
        <div className="rounded-xl bg-accent-soft border border-accent-edge px-5 py-4 text-[13px] text-accent">
          <span className="font-semibold">Manager access.</span>{" "}
          <span className="text-ink-soft">Use the nav to manage staffing, employees, and shifts.</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface p-5 md:p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      <div className="display text-[44px] md:text-[52px] text-ink mt-2 leading-none">{value}</div>
      <div className="text-[12px] text-ink-muted mt-2">{sub}</div>
    </div>
  );
}

function NextShiftStat({ shifts }: { shifts: { dateStr: string; startTime: string }[] }) {
  return (
    <div className="bg-surface p-5 md:p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Next shift</div>
      <NextShiftCard shifts={shifts} />
    </div>
  );
}

function SectionHeading({ title, count, accent }: { title: string; count: number; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between mb-3 md:mb-4">
      <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-ink">{title}</h2>
      <span className={`font-mono tnum text-[12px] ${accent ? "text-orange-600 dark:text-orange-400" : "text-ink-faint"}`}>
        {count.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

function DateBlock({ date, accent }: { date: Date; accent?: boolean }) {
  return (
    <div className="text-center min-w-[44px]">
      <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${accent ? "text-orange-600 dark:text-orange-400" : "text-ink-muted"}`}>
        {format(date, "EEE")}
      </div>
      <div className={`font-mono tnum text-[22px] font-semibold leading-none mt-1 ${accent ? "text-orange-800 dark:text-orange-300" : "text-ink"}`}>
        {format(date, "d")}
      </div>
    </div>
  );
}

function RoleTag({ job }: { job: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm shrink-0 ${ROLE_TAG[job]}`}>
      {JOB_LABEL[job]}
    </span>
  );
}

