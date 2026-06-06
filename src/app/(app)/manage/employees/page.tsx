import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import EmployeeRow from "./EmployeeRow";
import AddEmployeeForm from "./AddEmployeeForm";
import type { JobTitle } from "@prisma/client";

const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];

export default async function EmployeesPage() {
  await requireManager();
  const users = await db.user.findMany({
    include: { jobTitles: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-10">
        <div>
          <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Employees</h1>
          <p className="text-[13px] text-ink-muted mt-3 flex items-center gap-2">
            <span className="font-mono tnum">{users.length.toString().padStart(2, "0")}</span>
            <span>team member{users.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <AddEmployeeForm />
      </div>

      <div className="bg-surface border border-line rounded-xl divide-y divide-line-soft overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[15px] font-semibold text-ink-soft">No employees yet.</p>
            <p className="text-[13px] text-ink-faint mt-2">Click &quot;Add employee&quot; to get started.</p>
          </div>
        ) : (
          users.map((user) => (
            <EmployeeRow
              key={user.id}
              user={{ id: user.id, name: user.name, username: user.username, role: user.role }}
              currentJobTitles={user.jobTitles.map((j) => j.jobTitle)}
              allJobTitles={JOB_TITLES}
            />
          ))
        )}
      </div>
    </div>
  );
}
