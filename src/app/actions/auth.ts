"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { rateLimit, recordFailure, getClientIp } from "@/lib/rate-limit";
import { BCRYPT_COST, UsernameSchema, PasswordSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

const LoginSchema = z.object({
  username: UsernameSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

async function constantDelay() {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export async function login(formData: FormData) {
  const h = await headers();
  const ip = getClientIp(h.get("x-forwarded-for"));
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  const failKey = `login:fail:${ip}:${username}`;

  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    await constantDelay();
    return { error: "Invalid username or password." };
  }

  // Block only after many consecutive failed attempts — correct password always succeeds
  if (!rateLimit(failKey, 20, 60 * 60 * 1000, false)) {
    await constantDelay();
    return { error: "Too many failed attempts. Try again in an hour." };
  }

  const user = await db.user.findUnique({ where: { username: parsed.data.username } });
  const validPassword = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : await bcrypt.hash(parsed.data.password, BCRYPT_COST).then(() => false);

  await constantDelay();

  if (!user || !validPassword) {
    // Only count the window on failure
    recordFailure(failKey, 20, 60 * 60 * 1000);
    return { error: "Invalid username or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/dashboard");
}

export async function logout() {
  const session = await getSession();
  await session.destroy();
  redirect("/login");
}
