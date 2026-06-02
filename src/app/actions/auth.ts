"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { BCRYPT_COST, EmailSchema, PasswordSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

async function constantDelay() {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export async function login(formData: FormData) {
  const h = await headers();
  const ip = getClientIp(h.get("x-forwarded-for"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const ipKey = `login:ip:${ip}`;
  const emailKey = `login:email:${email}`;

  if (!rateLimit(ipKey, 5, 15 * 60 * 1000) || !rateLimit(emailKey, 10, 60 * 60 * 1000)) {
    await constantDelay();
    return { error: "Too many attempts. Try again later." };
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    await constantDelay();
    return { error: "Invalid email or password." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const validPassword = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : await bcrypt.hash(parsed.data.password, BCRYPT_COST).then(() => false);

  await constantDelay();

  if (!user || !validPassword) {
    return { error: "Invalid email or password." };
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
