import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import StaffingGrid from "./StaffingGrid";
import type { JobTitle } from "@prisma/client";

const DAYS = [
  { label: "Tue", dow: 2 },
  { label: "Wed", dow: 3 },
  { label: "Thu", dow: 4 },
  { label: "Fri", dow: 5 },
  { label: "Sat", dow: 6 },
  { label: "Sun", dow: 0 },
];
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
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Staffing</h1>
        <p className="text-[13px] text-ink-muted mt-3">Set how many people are needed per role each day.</p>
      </div>
      <StaffingGrid days={DAYS} jobTitles={JOB_TITLES} initialGrid={grid} />
    </div>
  );
}
