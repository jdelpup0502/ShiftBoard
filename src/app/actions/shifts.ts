"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireManager } from "@/lib/auth";
import { canClaim } from "@/lib/eligibility";
import type { JobTitle } from "@prisma/client";

export async function offerShift(shiftId: string) {
  const user = await requireUser();
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { offer: true } });
  if (!shift) return { error: "Shift not found." };
  if (shift.assignedUserId !== user.id) return { error: "Not your shift." };
  if (shift.isTraining) return { error: "Training shifts cannot be offered." };
  if (shift.offer) return { error: "Shift already offered." };

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

export async function createShift(formData: FormData) {
  await requireManager();
  const date = new Date(formData.get("date") as string);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const jobTitle = formData.get("jobTitle") as JobTitle;
  const assignedUserId = (formData.get("assignedUserId") as string) || null;
  const isTraining = formData.get("isTraining") === "true";
  const traineeUserId = isTraining ? ((formData.get("traineeUserId") as string) || null) : null;

  await db.shift.create({
    data: { date, startTime, endTime, jobTitle, assignedUserId, isTraining, traineeUserId },
  });
  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
}

export async function addShiftSlot(
  dateISO: string,
  jobTitle: JobTitle,
  startTime: string,
  assignedUserId: string | null,
): Promise<{ error?: string }> {
  await requireManager();
  if (!startTime) return { error: "Start time is required." };
  await db.shift.create({
    data: {
      date: new Date(dateISO),
      startTime,
      endTime: null,
      jobTitle,
      assignedUserId,
    },
  });
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return {};
}

export async function deleteShift(shiftId: string) {
  await requireManager();
  await db.shift.delete({ where: { id: shiftId } });
  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
}

export async function assignShift(shiftId: string, userId: string | null) {
  await requireManager();
  await db.shift.update({ where: { id: shiftId }, data: { assignedUserId: userId } });
  revalidatePath("/schedule");
  revalidatePath("/manage/shifts");
}
