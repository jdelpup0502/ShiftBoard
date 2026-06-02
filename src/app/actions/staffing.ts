"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { DayOfWeekSchema, JobTitleSchema, CountSchema, formatZodError } from "@/lib/validation";
import type { JobTitle } from "@prisma/client";

const RequirementSchema = z.object({
  dayOfWeek: DayOfWeekSchema,
  jobTitle: JobTitleSchema,
  count: CountSchema,
});

export async function upsertRequirement(dayOfWeek: number, jobTitle: JobTitle, count: number) {
  await requireManager();

  const parsed = RequirementSchema.safeParse({ dayOfWeek, jobTitle, count });
  if (!parsed.success) throw new Error(formatZodError(parsed.error));

  await db.staffingRequirement.upsert({
    where: { dayOfWeek_jobTitle: { dayOfWeek: parsed.data.dayOfWeek, jobTitle: parsed.data.jobTitle } },
    create: { dayOfWeek: parsed.data.dayOfWeek, jobTitle: parsed.data.jobTitle, count: parsed.data.count },
    update: { count: parsed.data.count },
  });
  revalidatePath("/manage/staffing");
  revalidatePath("/schedule");
}
