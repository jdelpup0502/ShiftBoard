import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import CreateShiftForm from "./CreateShiftForm";
import ShiftManagerRow from "./ShiftManagerRow";
import type { JobTitle } from "@prisma/client";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

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
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Shifts</h1>
          <p className="text-sm text-gray-500">Create shifts, assign employees, and manage training.</p>
        </div>
      </div>

      <CreateShiftForm employees={employeeOptions} />

      <div className="mt-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">Upcoming Shifts</h2>
        {shifts.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            No upcoming shifts. Create one above.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-200">
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
