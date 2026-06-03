import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import CreateShiftForm from "./CreateShiftForm";
import ShiftManagerRow from "./ShiftManagerRow";
import type { JobTitle } from "@prisma/client";

export default async function ManageShiftsPage() {
  await requireManager();

  const [shifts, employees] = await Promise.all([
    db.shift.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: {
        assignedUser: { select: { id: true, name: true } },
        trainee: { select: { id: true, name: true } },
        offer: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    db.user.findMany({
      include: { jobTitles: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const employeeOptions = employees.map((e) => ({
    id: e.id,
    name: e.name,
    jobTitles: e.jobTitles.map((j) => j.jobTitle as JobTitle),
  }));

  return (
    <div className="max-w-4xl">
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Manage shifts</h1>
        <p className="text-[13px] text-ink-muted mt-3">Create shifts, assign employees, and manage training.</p>
      </div>

      <CreateShiftForm employees={employeeOptions} />

      <div className="mt-10">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink mb-4">Upcoming shifts</h2>
        {shifts.length === 0 ? (
          <div className="border border-dashed border-line rounded-xl p-10 text-center bg-sunken/40">
            <p className="text-[13px] text-ink-faint italic">No upcoming shifts. Create one above.</p>
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-xl divide-y divide-line-soft overflow-hidden">
            {shifts.map((shift) => (
              <ShiftManagerRow
                key={shift.id}
                shift={{
                  id: shift.id,
                  date: shift.date.toISOString(),
                  startTime: shift.startTime,
                  endTime: shift.endTime,
                  jobTitle: shift.jobTitle,
                  assignedUserId: shift.assignedUserId,
                  assignedUserName: shift.assignedUser?.name ?? null,
                  isTraining: shift.isTraining,
                  traineeId: shift.traineeUserId,
                  traineeName: shift.trainee?.name ?? null,
                  offerStatus: shift.offer?.status ?? null,
                }}
                employees={employeeOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
