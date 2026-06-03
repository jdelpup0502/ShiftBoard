import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { format, isToday, isTomorrow } from "date-fns";
import ClientDate from "./ClientDate";
import OfferButton from "./OfferButton";
import CancelOfferButton from "./CancelOfferButton";
import {
  CalendarDaysIcon,
  ClockIcon,
  ArrowRightCircleIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { formatTime } from "@/lib/time";

const JOB_LABEL: Record<string, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const JOB_COLOR: Record<string, string> = {
  SERVER: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HOST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  BUSSER: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  BARTENDER: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

function shiftDayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();

  const [myShifts, myOffers] = await Promise.all([
    db.shift.findMany({
      where: { assignedUserId: user.id, isTraining: false, date: { gte: now } },
      include: { offer: true },
      orderBy: { date: "asc" },
    }),
    db.shiftOffer.findMany({
      where: { offeredById: user.id, status: "OPEN" },
      include: { shift: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const nextShift = myShifts[0] ?? null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <ClientDate />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Upcoming</span>
            <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{myShifts.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">shifts scheduled</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Offered</span>
            <ArrowRightCircleIcon className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{myOffers.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">shifts offered up</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Next shift</span>
            <ClockIcon className="w-5 h-5 text-emerald-400" />
          </div>
          {nextShift ? (
            <>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatTime(nextShift.startTime)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{shiftDayLabel(new Date(nextShift.date))}</div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-gray-400">—</div>
              <div className="text-sm text-gray-400 mt-0.5">None coming up</div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming shifts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BriefcaseIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Upcoming Shifts</h2>
        </div>
        {myShifts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming shifts scheduled.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myShifts.map((shift) => {
              const d = new Date(shift.date);
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[44px]">
                      <div className="text-xs font-semibold text-gray-400 uppercase">{format(d, "EEE")}</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">{format(d, "d")}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-700" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatTime(shift.startTime)}
                      </div>
                      <div className="text-xs text-gray-400">{format(d, "MMM yyyy")}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_COLOR[shift.jobTitle]}`}>
                      {JOB_LABEL[shift.jobTitle]}
                    </span>
                  </div>
                  {shift.offer?.status === "OPEN" ? (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 px-3 py-1 rounded-full font-semibold">
                      Offered up
                    </span>
                  ) : (
                    <OfferButton shiftId={shift.id} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Offered shifts */}
      {myOffers.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightCircleIcon className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Shifts You&apos;ve Offered</h2>
          </div>
          <div className="space-y-2">
            {myOffers.map((offer) => {
              const d = new Date(offer.shift.date);
              return (
                <div
                  key={offer.id}
                  className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl px-5 py-3.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[44px]">
                      <div className="text-xs font-semibold text-orange-400 uppercase">{format(d, "EEE")}</div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-300 leading-none">{format(d, "d")}</div>
                    </div>
                    <div className="w-px h-8 bg-orange-200 dark:bg-orange-800" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatTime(offer.shift.startTime)}
                      </div>
                      <div className="text-xs text-gray-400">{format(d, "MMM yyyy")}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_COLOR[offer.shift.jobTitle]}`}>
                      {JOB_LABEL[offer.shift.jobTitle]}
                    </span>
                  </div>
                  <CancelOfferButton offerId={offer.id} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(user.role === "MANAGER" || user.isAdmin) && (
        <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 px-5 py-4 text-sm text-indigo-800 dark:text-indigo-300">
          <span className="font-semibold">Manager access:</span> Use the nav above to manage staffing,
          employees, and shifts.
        </div>
      )}
    </div>
  );
}
