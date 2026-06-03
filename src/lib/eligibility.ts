import { db } from "./db";
import type { JobTitle } from "@prisma/client";

interface ShiftLike {
  id: string;
  date: Date;
  startTime: string;
  endTime: string | null;
  jobTitle: JobTitle;
  assignedUserId: string | null;
  isTraining: boolean;
}

export async function hasJobTitle(userId: string, jobTitle: JobTitle): Promise<boolean> {
  const job = await db.employeeJob.findUnique({
    where: { userId_jobTitle: { userId, jobTitle } },
  });
  return job !== null;
}

export async function hasShiftOnDate(
  userId: string,
  date: Date,
  excludeShiftId?: string,
): Promise<boolean> {
  const dateStart = new Date(date);
  dateStart.setUTCHours(0, 0, 0, 0);
  const dateEnd = new Date(dateStart);
  dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

  const existing = await db.shift.findFirst({
    where: {
      assignedUserId: userId,
      date: { gte: dateStart, lt: dateEnd },
      ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function canClaim(
  userId: string,
  shift: ShiftLike,
): Promise<{ ok: boolean; reason?: string }> {
  if (shift.assignedUserId === userId) {
    return { ok: false, reason: "You are already assigned to this shift." };
  }
  if (shift.isTraining) {
    return { ok: false, reason: "Training shifts cannot be claimed." };
  }
  if (!(await hasJobTitle(userId, shift.jobTitle))) {
    return { ok: false, reason: "You are not trained for this role." };
  }
  if (await hasShiftOnDate(userId, shift.date, shift.id)) {
    return { ok: false, reason: "You are already scheduled that day." };
  }
  return { ok: true };
}
