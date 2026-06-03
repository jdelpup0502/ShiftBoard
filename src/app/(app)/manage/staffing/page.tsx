import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import StaffingGrid from "./StaffingGrid";
import type { JobTitle } from "@prisma/client";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

const DAYS = [
  { label: "Tue", dow: 2 },
  { label: "Wed", dow: 3 },
  { label: "Thu", dow: 4 },
  { label: "Fri", dow: 5 },
  { label: "Sat", dow: 6 },
  { label: "Sun", dow: 0 },
]; // closed Mondays
const JOB_TITLES: JobTitle[] = ["SERVER", "HOST", "BUSSER", "BARTENDER"];

export default async function StaffingPage() {
  await requireManager();
  const requirements = await db.staffingRequirement.findMany();

  const grid: Record<string, number> = {};
  for (const r of requirements) {
    grid[`${r.dayOfWeek}-${r.jobTitle}`] = r.count;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardDocumentListIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staffing Requirements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set how many employees are needed per role each day.</p>
        </div>
      </div>
      <StaffingGrid days={DAYS} jobTitles={JOB_TITLES} initialGrid={grid} />
    </div>
  );
}
