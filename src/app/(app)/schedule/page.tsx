import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import type { JobTitle } from "@prisma/client";
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

const ROLE_DOT: Record<JobTitle, string> = {
  SERVER: "bg-sky-500",
  HOST: "bg-emerald-500",
  BUSSER: "bg-amber-500",
  BARTENDER: "bg-violet-500",
};

const ROLE_INK: Record<JobTitle, string> = {
  SERVER: "text-sky-700 dark:text-sky-300",
  HOST: "text-emerald-700 dark:text-emerald-300",
  BUSSER: "text-amber-700 dark:text-amber-400",
  BARTENDER: "text-violet-700 dark:text-violet-300",
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
  const now = new Date();
  // On Monday (day 1) the restaurant is closed; default view advances to the upcoming Tue–Sun week.
  const baseTuesday = startOfWeek(now, { weekStartsOn: 2 });
  const tuesday = addDays(
    now.getDay() === 1 ? addDays(baseTuesday, 7) : baseTuesday,
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
      <div className="mb-6 md:mb-8">
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
      <div className="hidden md:block overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted w-28 bg-sunken align-bottom">
                Role
              </th>
              <ScheduleHeader dayStrs={days.map((d) => format(d, "yyyy-MM-dd"))} />
            </tr>
          </thead>
          <tbody>
            {JOB_TITLES.map((role, ri) => (
              <tr key={role} className={ri < JOB_TITLES.length - 1 ? "border-b border-line" : ""}>
                <td className="px-4 py-3 align-top bg-sunken">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ROLE_DOT[role]}`} />
                    <span className={`text-[13px] font-semibold ${ROLE_INK[role]}`}>
                      {JOB_LABEL[role]}
                    </span>
                  </div>
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

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Your shift</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Offered up</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Training</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Understaffed</span>
      </div>
    </div>
  );
}
