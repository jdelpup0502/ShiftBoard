"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  BCRYPT_COST,
  UsernameSchema,
  NameSchema,
  PasswordSchema,
  RoleSchema,
  formatZodError,
} from "@/lib/validation";
import type { JobTitle, Role } from "@prisma/client";

const CreateEmployeeSchema = z.object({
  name: NameSchema,
  username: UsernameSchema,
  password: PasswordSchema,
});

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
  const manager = await requireManager();

  const parsed = RoleSchema.safeParse(role);
  if (!parsed.success) throw new Error("Invalid role.");


  if (parsed.data === "EMPLOYEE") {
    const targetUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (targetUser?.role === "MANAGER") {
      const managerCount = await db.user.count({ where: { role: "MANAGER" } });
      if (managerCount <= 1) {
        throw new Error("Cannot demote the last manager.");
      }
    }
  }

  const target = await db.user.update({
    where: { id: userId },
    data: { role: parsed.data },
  });

  await writeAuditLog(manager.id, "UPDATE_ROLE", "User", userId, {
    username: target.username,
    newRole: parsed.data,
  });

  revalidatePath("/manage/employees");
}

export async function createEmployee(formData: FormData): Promise<{ error?: string }> {
  const manager = await requireManager();

  const h = await headers();
  const ip = getClientIp(h.get("x-forwarded-for"));
  if (!rateLimit(`create-employee:${manager.id}:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: "Too many requests. Try again later." };
  }

  const parsed = CreateEmployeeSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const { name, username, password } = parsed.data;

  const exists = await db.user.findUnique({ where: { username } });
  if (exists) return { error: "An account with that username already exists." };

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await db.user.create({ data: { name, username, passwordHash, role: "EMPLOYEE" } });

  await writeAuditLog(manager.id, "CREATE_EMPLOYEE", "User", user.id, { username });

  revalidatePath("/manage/employees");
  return {};
}

export async function deleteEmployee(userId: string) {
  const manager = await requireManager();

  if (userId === manager.id) throw new Error("You cannot delete your own account.");

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true, username: true } });
  if (!target) throw new Error("User not found.");

  if (target.role === "MANAGER") {
    const managerCount = await db.user.count({ where: { role: "MANAGER" } });
    if (managerCount <= 1) throw new Error("Cannot delete the last manager.");
  }

  await db.shiftOffer.deleteMany({ where: { offeredById: userId } });
  await db.user.delete({ where: { id: userId } });

  await writeAuditLog(manager.id, "DELETE_EMPLOYEE", "User", userId, { username: target.username });

  revalidatePath("/manage/employees");
}
