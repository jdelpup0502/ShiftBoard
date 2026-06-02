import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import EmployeeRow from "./EmployeeRow";
import AddEmployeeForm from "./AddEmployeeForm";
import type { JobTitle } from "@prisma/client";
import { UserGroupIcon } from "@heroicons/react/24/outline";

const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];

export default async function EmployeesPage() {
  await requireManager();
  const users = await db.user.findMany({
    include: { jobTitles: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="w-6 h-6 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} team member{users.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <AddEmployeeForm />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
        {users.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <UserGroupIcon className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-600" />
            <p className="font-medium">No employees yet.</p>
            <p className="text-sm mt-1">Click &quot;Add Employee&quot; to get started.</p>
          </div>
        ) : (
          users.map((user) => (
            <EmployeeRow
              key={user.id}
              user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
              currentJobTitles={user.jobTitles.map((j) => j.jobTitle)}
              allJobTitles={JOB_TITLES}
            />
          ))
        )}
      </div>
    </div>
  );
}
