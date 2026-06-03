import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { startOfWeek, addDays, format } from "date-fns";
import AvailabilityGrid from "./AvailabilityGrid";

export default async function AvailabilityPage() {
  const user = await requireUser();
  if (user.role === "MANAGER") redirect("/manage/availability");
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);

  const records = await db.availability.findMany({
    where: { userId: user.id, weekStart },
  });

  const initial = Object.fromEntries(
    records.map((r) => [r.dayOfWeek, { available: r.available, note: r.note }])
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Availability</h1>
        <p className="text-[13px] text-ink-muted mt-3">
          Next week — <span className="font-mono tnum text-ink-soft">{format(weekStart, "MMM d, yyyy")}</span>
        </p>
      </div>
      <AvailabilityGrid weekStartISO={weekStart.toISOString()} initial={initial} />
    </div>
  );
}
