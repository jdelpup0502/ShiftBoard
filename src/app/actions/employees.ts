"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import type { JobTitle, Role } from "@prisma/client";

export async function updateEmployeeJobs(userId: string, jobTitles: JobTitle[]) {
  await requireManager();
  await db.employeeJob.deleteMany({ where: { userId } });
  if (jobTitles.length > 0) {
    await db.employeeJob.createMany({
      data: jobTitles.map((jobTitle) => ({ userId, jobTitle })),
    });
  }
  revalidatePath("/manage/employees");
}

export async function updateRole(userId: string, role: Role) {
  await requireManager();
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/manage/employees");
}

export async function createEmployee(formData: FormData): Promise<{ error?: string }> {
  await requireManager();
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || password.length < 6) {
    return { error: "All fields required; password min 6 characters." };
  }
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Email already in use." };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({ data: { name, email, passwordHash, role: "EMPLOYEE" } });
  revalidatePath("/manage/employees");
  return {};
}

export async function deleteEmployee(userId: string) {
  await requireManager();
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/manage/employees");
}
