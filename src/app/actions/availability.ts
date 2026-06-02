"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfWeek } from "date-fns";
import { DayOfWeekSchema, NoteSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

const AvailabilitySchema = z.object({
  dayOfWeek: DayOfWeekSchema,
  available: z.boolean(),
  note: NoteSchema,
});

export async function upsertAvailability(
  dayOfWeek: number,
  available: boolean,
  note: string,
  weekStartISO?: string,
): Promise<{ error?: string }> {
  const user = await requireUser();

  const parsed = AvailabilitySchema.safeParse({ dayOfWeek, available, note });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  let weekStart: Date;
  if (weekStartISO) {
    const d = new Date(weekStartISO);
    if (isNaN(d.getTime())) return { error: "Invalid week start date." };
    const expectedStart = startOfWeek(d, { weekStartsOn: 1 });
    if (Math.abs(expectedStart.getTime() - d.getTime()) > 86_400_000) {
      return { error: "Invalid week start date." };
    }
    weekStart = d;
  } else {
    weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  }

  await db.availability.upsert({
    where: {
      userId_weekStart_dayOfWeek: {
        userId: user.id,
        weekStart,
        dayOfWeek: parsed.data.dayOfWeek,
      },
    },
    update: { available: parsed.data.available, note: parsed.data.note },
    create: {
      userId: user.id,
      weekStart,
      dayOfWeek: parsed.data.dayOfWeek,
      available: parsed.data.available,
      note: parsed.data.note,
    },
  });

  revalidatePath("/availability");
  revalidatePath("/manage/availability");
  return {};
}
