import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { startOfWeek, addDays, format } from "date-fns";

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
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);

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
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Staff availability</h1>
        <p className="text-[13px] text-ink-muted mt-3">
          Next week — <span className="font-mono tnum text-ink-soft">{format(weekStart, "MMM d, yyyy")}</span>
        </p>
      </div>

      {employees.length === 0 ? (
        <p className="text-[13px] text-ink-faint">No employees found.</p>
      ) : (
        <>
        {/* Mobile: per-employee cards */}
        <div className="md:hidden space-y-3">
          {employees.map((emp) => {
            const empAvail = byUser[emp.id] ?? {};
            const hasSubmitted = Object.keys(empAvail).length > 0;
            return (
              <div key={emp.id} className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-line-soft flex items-center justify-between">
                  <div className="font-semibold text-[14px] text-ink">{emp.name}</div>
                  {!hasSubmitted && (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">No response</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {DAYS.map(({ dow, label }) => {
                    const rec = empAvail[dow];
                    const available = rec?.available ?? true;
                    return (
                      <div key={dow} className="flex flex-col items-center gap-1.5 py-2 rounded-md bg-sunken">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</span>
                        {!hasSubmitted ? (
                          <span className="text-ink-faint text-sm">—</span>
                        ) : (
                          <>
                            <span
                              className={`inline-flex text-[11px] font-semibold w-5 h-5 rounded-full items-center justify-center ${
                                available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              }`}
                            >
                              {available ? "✓" : "✗"}
                            </span>
                            {rec?.note && (
                              <span className="text-[10px] text-ink-muted text-center px-1 line-clamp-2" title={rec.note}>
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
        <div className="hidden md:block overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-sunken">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted w-44">
                  Employee
                </th>
                {DAYS.map((d) => (
                  <th key={d.dow} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted min-w-[90px]">
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
                  <tr key={emp.id} className={ei < employees.length - 1 ? "border-b border-line-soft" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink text-[14px]">{emp.name}</div>
                      {!hasSubmitted && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mt-0.5">No response</div>
                      )}
                    </td>
                    {DAYS.map(({ dow }) => {
                      const rec = empAvail[dow];
                      if (!hasSubmitted) {
                        return (
                          <td key={dow} className="px-3 py-3 text-center">
                            <span className="text-ink-faint text-xs">—</span>
                          </td>
                        );
                      }
                      const available = rec?.available ?? true;
                      return (
                        <td key={dow} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center justify-center text-[11px] font-semibold w-5 h-5 rounded-full ${
                                available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              }`}
                            >
                              {available ? "✓" : "✗"}
                            </span>
                            {rec?.note && (
                              <span className="text-[10px] text-ink-faint max-w-[80px] truncate" title={rec.note}>
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

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-[8px] font-semibold">✓</span> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-700 dark:text-red-300 text-[8px] font-semibold">✗</span> Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint">—</span>&nbsp;No response yet
        </span>
      </div>
    </div>
  );
}
