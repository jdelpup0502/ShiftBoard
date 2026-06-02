"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();

  if (!name || !email) return { error: "Name and email are required." };

  const conflict = await db.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (conflict) return { error: "That email is already in use." };

  await db.user.update({ where: { id: user.id }, data: { name, email } });
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();
  const current = formData.get("current") as string;
  const next = formData.get("next") as string;
  const confirm = formData.get("confirm") as string;

  if (!current || !next || !confirm) return { error: "All fields are required." };
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  if (next !== confirm) return { error: "New passwords don't match." };

  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh || !(await bcrypt.compare(current, fresh.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: true };
}
