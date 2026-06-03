import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import type { JobTitle } from "@prisma/client";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import ScheduleCell from "./ScheduleCell";
import ScheduleHeader from "./ScheduleHeader";
import WeekNav from "./WeekNav";
import MobileSchedule from "./MobileSchedule";
import { pruneOldShifts } from "@/lib/cleanup";

const MIN_WEEK_OFFSET = -1;
const MAX_WEEK_OFFSET = 2;

function parseWeekOffset(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  if (!Number.isInteger(n) || n < MIN_WEEK_OFFSET || n > MAX_WEEK_OFFSET) return 0;
  return n;
}

const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];
const JOB_LABEL: Record<JobTitle, string> = {
  SERVER: "Server",
  HOST: "Host",
  BUSSER: "Busser",
  BARTENDER: "Bartender",
};

const JOB_ROW_COLOR: Record<JobTitle, string> = {
  SERVER: "bg-blue-100 dark:bg-blue-900/30",
  HOST: "bg-emerald-100 dark:bg-emerald-900/30",
  BUSSER: "bg-amber-100 dark:bg-amber-900/30",
  BARTENDER: "bg-purple-100 dark:bg-purple-900/30",
};

const ROLE_BADGE: Record<JobTitle, string> = {
  SERVER: "bg-blue-600 text-white",
  HOST: "bg-emerald-600 text-white",
  BUSSER: "bg-amber-500 text-white",
  BARTENDER: "bg-purple-600 text-white",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const user = await requireUser();
  const isManager = user.role === "MANAGER";
  await pruneOldShifts();
  const weekOffset = parseWeekOffset((await searchParams).week);
  const tuesday = addDays(
    startOfWeek(new Date(), { weekStartsOn: 2 }),
    weekOffset * 7,
  );
  const days = Array.from({ length: 6 }, (_, i) => addDays(tuesday, i));
  const weekOfLabel = format(addDays(tuesday, -1), "MMMM d, yyyy");

  const [shifts, requirements, employees] = await Promise.all([
    db.shift.findMany({
      where: { date: { gte: tuesday, lt: addDays(tuesday, 6) } },
      include: { assignedUser: true, trainee: true, offer: true },
      orderBy: { startTime: "asc" },
    }),
    db.staffingRequirement.findMany(),
    isManager
      ? db.user.findMany({
          include: { jobTitles: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const reqMap = new Map<string, number>();
  for (const r of requirements) {
    reqMap.set(`${r.dayOfWeek}-${r.jobTitle}`, r.count);
  }

  const reqRecord: Record<string, number> = {};
  reqMap.forEach((v, k) => {
    reqRecord[k] = v;
  });

  const dayStrs = days.map((d) => format(d, "yyyy-MM-dd"));

  const mobileShifts = shifts.map((s) => ({
    id: s.id,
    date: format(new Date(s.date), "yyyy-MM-dd"),
    jobTitle: s.jobTitle,
    startTime: s.startTime,
    endTime: s.endTime,
    assignedUserId: s.assignedUserId,
    assignedUserName: s.assignedUser?.name ?? null,
    isTraining: s.isTraining,
    traineeName: s.trainee?.name ?? null,
    isOffered: s.offer?.status === "OPEN",
  }));

  const employeesByRole = {
    SERVER: employees.filter((e) => e.jobTitles.some((j) => j.jobTitle === "SERVER")).map((e) => ({ id: e.id, name: e.name })),
    HOST: employees.filter((e) => e.jobTitles.some((j) => j.jobTitle === "HOST")).map((e) => ({ id: e.id, name: e.name })),
    BUSSER: employees.filter((e) => e.jobTitles.some((j) => j.jobTitle === "BUSSER")).map((e) => ({ id: e.id, name: e.name })),
    BARTENDER: employees.filter((e) => e.jobTitles.some((j) => j.jobTitle === "BARTENDER")).map((e) => ({ id: e.id, name: e.name })),
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDaysIcon className="w-6 h-6 text-gray-400 hidden md:block" />
        <WeekNav weekOffset={weekOffset} weekOfLabel={weekOfLabel} />
      </div>

      {/* Mobile: day-at-a-time view */}
      <div className="md:hidden">
        <MobileSchedule
          dayStrs={dayStrs}
          currentUserId={user.id}
          isManager={isManager}
          shifts={mobileShifts}
          reqMap={reqRecord}
          employeesByRole={employeesByRole}
        />
      </div>

      {/* Desktop: weekly table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-28 bg-gray-100 dark:bg-gray-700">
                Role
              </th>
              <ScheduleHeader dayStrs={days.map((d) => format(d, "yyyy-MM-dd"))} />
            </tr>
          </thead>
          <tbody>
            {JOB_TITLES.map((role, ri) => (
              <tr key={role} className={ri < JOB_TITLES.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}>
                <td className={`px-4 py-3 align-top ${JOB_ROW_COLOR[role]}`}>
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}>
                    {JOB_LABEL[role]}
                  </span>
                </td>
                {days.map((day) => {
                  const dow = day.getDay();
                  const required = reqMap.get(`${dow}-${role}`) ?? 0;
                  const dayShifts = shifts.filter(
                    (s) => isSameDay(new Date(s.date), day) && s.jobTitle === role
                  );
                  const eligible = employees.filter((e) =>
                    e.jobTitles.some((j) => j.jobTitle === role)
                  );

                  return (
                    <ScheduleCell
                      key={day.toISOString()}
                      dateStr={format(day, "yyyy-MM-dd")}
                      jobTitle={role}
                      required={required}
                      currentUserId={user.id}
                      isManager={isManager}
                      shifts={dayShifts.map((s) => ({
                        id: s.id,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        assignedUserId: s.assignedUserId,
                        assignedUserName: s.assignedUser?.name ?? null,
                        isTraining: s.isTraining,
                        traineeName: s.trainee?.name ?? null,
                        isOffered: s.offer?.status === "OPEN",
                      }))}
                      employees={eligible.map((e) => ({ id: e.id, name: e.name }))}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300 inline-block" /> Your shift</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" /> Offered up</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-100 border border-violet-300 inline-block" /> Training</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" /> Understaffed</span>
      </div>
    </div>
  );
}
