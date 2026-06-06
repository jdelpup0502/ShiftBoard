"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requireManager } from "@/lib/auth";
import { canClaim, hasJobTitle, hasShiftOnDate } from "@/lib/eligibility";
import { writeAuditLog } from "@/lib/audit";
import { JobTitleSchema, formatZodError } from "@/lib/validation";
import type { JobTitle } from "@prisma/client";

export async function offerShift(shiftId: string) {
  const user = await requireUser();
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { offer: true } });
  if (!shift) return { error: "Shift not found." };
  if (shift.assignedUserId !== user.id) return { error: "Not your shift." };
  if (shift.isTraining) return { error: "Training shifts cannot be offered." };
  if (shift.offer) return { error: "Shift already offered." };
  const [h, m] = shift.startTime.split(":").map(Number);
  const shiftStart = new Date(shift.date);
  shiftStart.setHours(h, m, 0, 0);
  if (shiftStart <= new Date()) return { error: "This shift has already started and cannot be offered." };

  await db.shiftOffer.create({
    data: { shiftId, offeredById: user.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/marketplace");
}

export async function cancelOffer(offerId: string) {
  const user = await requireUser();
  const offer = await db.shiftOffer.findUnique({ where: { id: offerId } });
  if (!offer) return { error: "Offer not found." };
  if (offer.offeredById !== user.id) return { error: "Not your offer." };
  if (offer.status !== "OPEN") return { error: "Offer is no longer open." };

  await db.shiftOffer.update({ where: { id: offerId }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/marketplace");
}

export async function claimShift(offerId: string) {
  const user = await requireUser();

  try {
    await db.$transaction(async (tx) => {
      const offer = await tx.shiftOffer.findUnique({
        where: { id: offerId },
        include: { shift: true },
      });
      if (!offer || offer.status !== "OPEN") throw new Error("Offer is no longer available.");

      const check = await canClaim(user.id, offer.shift);
      if (!check.ok) throw new Error(check.reason);

      await tx.shiftOffer.update({
        where: { id: offerId },
        data: { status: "CLAIMED", claimedById: user.id, claimedAt: new Date() },
      });
      await tx.shift.update({
        where: { id: offer.shiftId },
        data: { assignedUserId: user.id },
      });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/marketplace");
}

const CreateShiftSchema = z.object({
  jobTitle: JobTitleSchema,
});

export async function createShift(formData: FormData): Promise<{ error?: string }> {
  const manager = await requireManager();

  const jobTitleRaw = formData.get("jobTitle") as string;
  const parsed = CreateShiftSchema.safeParse({ jobTitle: jobTitleRaw });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const dateStr = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = (formData.get("endTime") as string) || null;
  const assignedUserId = (formData.get("assignedUserId") as string) || null;
  const isTraining = formData.get("isTraining") === "true";
  const traineeUserId = isTraining ? ((formData.get("traineeUserId") as string) || null) : null;

  const [cy, cm, cd] = dateStr.split("-").map(Number);
  const date = new Date(cy, cm - 1, cd);
  if (isNaN(date.getTime())) return { error: "Invalid date." };
  if (!startTime) return { error: "Start time is required." };

  if (assignedUserId) {
    const qualified = await hasJobTitle(assignedUserId, parsed.data.jobTitle);
    if (!qualified) return { error: "Assigned user is not trained for this role." };
    if (await hasShiftOnDate(assignedUserId, date)) {
      return { error: "That employee is already scheduled on this day." };
    }
  }

  if (traineeUserId) {
    const traineeUser = await db.user.findUnique({
      where: { id: traineeUserId },
      select: { role: true },
    });
    if (!traineeUser) return { error: "Trainee user not found." };
  }

  const shift = await db.shift.create({
    data: {
      date,
      startTime,
      endTime,
      jobTitle: parsed.data.jobTitle,
      assignedUserId,
      isTraining,
      traineeUserId,
    },
  });

  await writeAuditLog(manager.id, "CREATE_SHIFT", "Shift", shift.id, {
    jobTitle: parsed.data.jobTitle,
    date: dateStr,
    assignedUserId: assignedUserId ?? "unassigned",
  });

  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
  return {};
}

export async function addShiftSlot(
  dateISO: string,
  jobTitle: JobTitle,
  startTime: string,
  assignedUserId: string | null,
): Promise<{ error?: string }> {
  const manager = await requireManager();

  const parsed = CreateShiftSchema.safeParse({ jobTitle });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  if (!startTime) return { error: "Start time is required." };

  const [dy, dm, dd] = dateISO.split("-").map(Number);
  const date = new Date(dy, dm - 1, dd);
  if (isNaN(date.getTime())) return { error: "Invalid date." };

  if (assignedUserId) {
    const qualified = await hasJobTitle(assignedUserId, parsed.data.jobTitle);
    if (!qualified) return { error: "Assigned user is not trained for this role." };
    if (await hasShiftOnDate(assignedUserId, date)) {
      return { error: "That employee is already scheduled on this day." };
    }
  }

  const shift = await db.shift.create({
    data: {
      date,
      startTime,
      endTime: null,
      jobTitle: parsed.data.jobTitle,
      assignedUserId,
    },
  });

  await writeAuditLog(manager.id, "CREATE_SHIFT", "Shift", shift.id, {
    jobTitle: parsed.data.jobTitle,
    date: dateISO,
    source: "schedule_grid",
  });

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return {};
}

export async function deleteShift(shiftId: string) {
  const manager = await requireManager();
  await db.shift.delete({ where: { id: shiftId } });
  await writeAuditLog(manager.id, "DELETE_SHIFT", "Shift", shiftId, {});
  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
}

export async function assignShift(shiftId: string, userId: string | null): Promise<{ error?: string }> {
  const manager = await requireManager();
  if (userId) {
    const shift = await db.shift.findUnique({ where: { id: shiftId }, select: { date: true } });
    if (!shift) return { error: "Shift not found." };
    if (await hasShiftOnDate(userId, shift.date, shiftId)) {
      return { error: "That employee is already scheduled on this day." };
    }
  }
  await db.shift.update({ where: { id: shiftId }, data: { assignedUserId: userId } });
  await writeAuditLog(manager.id, "ASSIGN_SHIFT", "Shift", shiftId, {
    assignedTo: userId ?? "unassigned",
  });
  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
  return {};
}
