"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import type { JobTitle } from "@prisma/client";

export async function upsertRequirement(dayOfWeek: number, jobTitle: JobTitle, count: number) {
  await requireManager();
  await db.staffingRequirement.upsert({
    where: { dayOfWeek_jobTitle: { dayOfWeek, jobTitle } },
    create: { dayOfWeek, jobTitle, count },
    update: { count },
  });
  revalidatePath("/manage/staffing");
  revalidatePath("/schedule");
}
