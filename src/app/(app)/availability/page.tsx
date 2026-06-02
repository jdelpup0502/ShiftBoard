import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfWeek, format } from "date-fns";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import AvailabilityGrid from "./AvailabilityGrid";

export default async function AvailabilityPage() {
  const user = await requireUser();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const records = await db.availability.findMany({
    where: { userId: user.id, weekStart },
  });

  const initial = Object.fromEntries(
    records.map((r) => [r.dayOfWeek, { available: r.available, note: r.note }])
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDaysIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Availability</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Week of {format(weekStart, "MMMM d, yyyy")}</p>
        </div>
      </div>
      <AvailabilityGrid weekStartISO={weekStart.toISOString()} initial={initial} />
    </div>
  );
}
