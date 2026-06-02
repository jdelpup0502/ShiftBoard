"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfWeek } from "date-fns";

export async function upsertAvailability(
  dayOfWeek: number,
  available: boolean,
  note: string,
  weekStartISO?: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const weekStart = weekStartISO
    ? new Date(weekStartISO)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  await db.availability.upsert({
    where: { userId_weekStart_dayOfWeek: { userId: user.id, weekStart, dayOfWeek } },
    update: { available, note: note || null },
    create: { userId: user.id, weekStart, dayOfWeek, available, note: note || null },
  });

  revalidatePath("/availability");
  revalidatePath("/manage/availability");
  return {};
}
