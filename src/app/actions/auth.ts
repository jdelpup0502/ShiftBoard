"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || password.length < 6) {
    return { error: "All fields required; password min 6 characters." };
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Email already in use." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { name, email, passwordHash } });

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
