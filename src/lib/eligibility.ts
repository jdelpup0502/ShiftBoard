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

function timesOverlap(
  aStart: string,
  aEnd: string | null,
  bStart: string,
  bEnd: string | null,
): boolean {
  if (!aEnd || !bEnd) return aStart === bStart;
  return aStart < bEnd && bStart < aEnd;
}

export async function hasJobTitle(userId: string, jobTitle: JobTitle): Promise<boolean> {
  const job = await db.employeeJob.findUnique({
    where: { userId_jobTitle: { userId, jobTitle } },
  });
  return job !== null;
}

export async function canClaim(
  userId: string,
  shift: ShiftLike
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

  const dateStart = new Date(shift.date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);

  const sameDayShifts = await db.shift.findMany({
    where: {
      assignedUserId: userId,
      date: { gte: dateStart, lt: dateEnd },
      id: { not: shift.id },
    },
  });

  for (const other of sameDayShifts) {
    if (timesOverlap(shift.startTime, shift.endTime, other.startTime, other.endTime ?? null)) {
      return { ok: false, reason: "You have a conflicting shift that day." };
    }
  }

  return { ok: true };
}
