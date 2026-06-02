"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  BCRYPT_COST,
  EmailSchema,
  NameSchema,
  PasswordSchema,
  formatZodError,
} from "@/lib/validation";

const ProfileSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
});

const PasswordChangeSchema = z.object({
  current: z.string().min(1, "Current password is required.").max(128),
  next: PasswordSchema,
  confirm: z.string().min(1, "Please confirm your new password."),
});

export async function updateProfile(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const { name, email } = parsed.data;

  const conflict = await db.user.findFirst({ where: { email, NOT: { id: user.id } } });
  if (conflict) return { error: "That email is already in use." };

  await db.user.update({ where: { id: user.id }, data: { name, email } });
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();

  const h = await headers();
  const ip = getClientIp(h.get("x-forwarded-for"));
  if (!rateLimit(`password:${user.id}:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many attempts. Try again later." };
  }

  const parsed = PasswordChangeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: formatZodError(parsed.error) };

  const { current, next, confirm } = parsed.data;

  if (next !== confirm) return { error: "New passwords don't match." };

  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh || !(await bcrypt.compare(current, fresh.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, BCRYPT_COST);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  const session = await getSession();
  await session.destroy();
  redirect("/login");
}
