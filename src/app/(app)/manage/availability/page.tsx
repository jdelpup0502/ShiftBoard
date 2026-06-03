import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { startOfWeek, format } from "date-fns";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const DAYS = [
  { label: "Tue", dow: 2 },
  { label: "Wed", dow: 3 },
  { label: "Thu", dow: 4 },
  { label: "Fri", dow: 5 },
  { label: "Sat", dow: 6 },
  { label: "Sun", dow: 0 },
];

export default async function ManagerAvailabilityPage() {
  await requireManager();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [employees, availabilityRecords] = await Promise.all([
    db.user.findMany({ where: { role: "EMPLOYEE" }, orderBy: { name: "asc" } }),
    db.availability.findMany({ where: { weekStart }, include: { user: true } }),
  ]);

  const byUser: Record<string, Record<number, { available: boolean; note: string | null }>> = {};
  for (const r of availabilityRecords) {
    if (!byUser[r.userId]) byUser[r.userId] = {};
    byUser[r.userId][r.dayOfWeek] = { available: r.available, note: r.note };
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UserGroupIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Staff Availability</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Week of {format(weekStart, "MMMM d, yyyy")}</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <p className="text-gray-400 text-sm">No employees found.</p>
      ) : (
        <>
        {/* Mobile: per-employee cards */}
        <div className="md:hidden space-y-3">
          {employees.map((emp) => {
            const empAvail = byUser[emp.id] ?? {};
            const hasSubmitted = Object.keys(empAvail).length > 0;
            return (
              <div key={emp.id} className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{emp.name}</div>
                  {!hasSubmitted && <span className="text-xs italic text-gray-400">No response</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {DAYS.map(({ dow, label }) => {
                    const rec = empAvail[dow];
                    const available = rec?.available ?? true;
                    return (
                      <div key={dow} className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
                        {!hasSubmitted ? (
                          <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                        ) : (
                          <>
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                                available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              }`}
                            >
                              {available ? "✓" : "✗"}
                            </span>
                            {rec?.note && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center px-1 line-clamp-2" title={rec.note}>
                                {rec.note}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-40">
                  Employee
                </th>
                {DAYS.map((d) => (
                  <th key={d.dow} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 min-w-[90px]">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, ei) => {
                const empAvail = byUser[emp.id] ?? {};
                const hasSubmitted = Object.keys(empAvail).length > 0;
                return (
                  <tr key={emp.id} className={ei < employees.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{emp.name}</div>
                      {!hasSubmitted && (
                        <div className="text-xs text-gray-400 italic">No response</div>
                      )}
                    </td>
                    {DAYS.map(({ dow }) => {
                      const rec = empAvail[dow];
                      if (!hasSubmitted) {
                        return (
                          <td key={dow} className="px-3 py-3 text-center">
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          </td>
                        );
                      }
                      const available = rec?.available ?? true;
                      return (
                        <td key={dow} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                                available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              }`}
                            >
                              {available ? "✓" : "✗"}
                            </span>
                            {rec?.note && (
                              <span className="text-[10px] text-gray-400 max-w-[80px] truncate" title={rec.note}>
                                {rec.note}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 inline-block" /> Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-gray-300 dark:text-gray-600">—</span>&nbsp;No response yet
        </span>
      </div>
    </div>
  );
}
